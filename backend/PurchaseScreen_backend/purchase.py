from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import random

from backend.database import users_collection, order_collection, item_collection
from backend.registerloginbackend.jwt_handler import get_current_user

###
from datetime import datetime, timezone, timedelta
from bson import ObjectId

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.mime.text import MIMEText
from io import BytesIO
from reportlab.pdfgen import canvas
###

router = APIRouter()


# For production, load from a secure config or env variable
from cryptography.fernet import Fernet
SECRET_KEY = Fernet.generate_key()  # Temporary for dev
fernet = Fernet(SECRET_KEY)

class NewEntry(BaseModel):
    value: str

@router.post("/add-credit-card")
async def add_credit_card(entry: NewEntry, current_user: dict = Depends(get_current_user)):
    encrypted = fernet.encrypt(entry.value.encode()).decode()
    result = await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$push": {"credit_cards": encrypted}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or card not added.")
    return {"message": "Credit card added successfully"}

@router.post("/add-address")
async def add_address(entry: NewEntry, current_user: dict = Depends(get_current_user)):
    result = await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$push": {"addresses": entry.value}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or address not added.")
    return {"message": "Address added successfully"}




# Response Models
class CartItemResponse(BaseModel):
    item_names: list[str]

class UserDropdownData(BaseModel):
    credit_cards: list[str]
    addresses: list[str]

class CreateOrderRequest(BaseModel):
    selected_address: str
    selected_credit_card: str

###
class Order(BaseModel):
    order_id: str
    item_ids: list[str]
    shipping_address: str
    payment_info: str
    user_id: str
    date: datetime
    total_price: int
    number_of_items: int 
###

# API Endpoints
@router.get("/cart-items", response_model=CartItemResponse)
async def get_cart_items(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user = await users_collection.find_one({"user_id": user_id}, {"basket": 1, "_id": 0})
    item_ids = user.get("basket", [])

    if not item_ids:
        return {"item_names": []}  # Changed from "title" to "item_names"

    items_cursor = item_collection.find({"item_id": {"$in": item_ids}})
    items = await items_cursor.to_list(length=None)
    item_names = [item["title"] for item in items]

    return {"item_names": item_names}  # Changed from "title" to "item_names"

@router.get("/user-dropdown-data", response_model=UserDropdownData)
async def get_user_dropdown_data(current_user: dict = Depends(get_current_user)):
    from database import users_collection  # import here if not already at the top

    # Find the full user document from the DB
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Decrypt and mask the credit cards
    decrypted_cards = []
    for enc in user.get("credit_cards", []):
        try:
            plain = fernet.decrypt(enc.encode()).decode()
            decrypted_cards.append(f"**** **** **** {plain[-4:]}")
        except Exception:
            decrypted_cards.append("Invalid Card")

    return {
        "credit_cards": decrypted_cards,
        "addresses": user.get("addresses", [])
    }

@router.post("/complete-order")
async def complete_order(data: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    
    ## Get the current user's user_id
    user_id = current_user["user_id"]

    ## Get the basket of the current_user
    user = await users_collection.find_one({"user_id": user_id}, {"basket": 1, "_id": 0})
    item_ids = user.get("basket", [])


    if not item_ids:
        raise HTTPException(status_code=400, detail="Cart is empty, cannot create order")
    

    ## Now we will generate a row for order_collection

    ## Create a list of all order_id values (to make sure that the newly generated order_id isn't a duplicate)
    order_cursor = order_collection.find({}, {'order_id': 1, '_id': 0})
    order_docs = await order_cursor.to_list(length=None)
    order_ids = [doc['order_id'] for doc in order_docs]

    ## Generate a new order_id until one that hasn't already been used is found
    while True:
        order_id_number = random.randint(0, 99999)
        order_id = f"order{order_id_number:05d}"
        if order_id not in order_ids:
            break

    ###
    ## Now, let us create a date object
    utc_plus_3 = timezone(timedelta(hours=3))
    now = datetime.now(utc_plus_3)

    ## Let us calculate the total price
    pipeline = [
        {"$match": {"item_id": {"$in": item_ids}}},
        {"$group": {"_id": None, "total_price": {"$sum": "$price"}}}
    ]
    result = await item_collection.aggregate(pipeline).to_list(length=1)
    total_price = result[0]["total_price"] if result else 0

    ## ..and the total number of items
    number_of_items = len(item_ids)
    ###


    new_order = {
        "order_id": order_id,
        "item_ids": item_ids,
        "shipping_address": data.selected_address,
        "payment_info": data.selected_credit_card,
        "user_id": user_id,
        ###
        "date": now,
        "total_price": total_price,
        "number_of_items": number_of_items
        ###
    }
    await order_collection.insert_one(new_order)

    # Update the stock and delivery status of each item in item_collection
    for item_id in item_ids:
        await item_collection.update_one(
            {"item_id": item_id},
            {"$set": {"isSold": "processing", "inStock": False}}
        )

    ## Empty the cart
    await users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"basket": []}}
    )

    ## Now we will generate the invoice

    ## First, generate the list of item names
    item_cursor = item_collection.find(
        {"item_id": {"$in": item_ids}},
        {"title": 1, "_id": 0}
    )
    item_docs = await item_cursor.to_list(length=None)
    item_names = [doc["title"] for doc in item_docs]
    
    message = (
        "Thank you for your purchase!\n\n"
        "The details of your purchase are as follows:\n\n"
        f"Order ID: {order_id}\n\n"
        f"Purchased Items: {', '.join(item_names)}\n\n"
        f"Payment Info: {data.selected_credit_card}\n\n"
        f"Shipping Address: {data.selected_address}\n\n"
        ###
        f"Date: {now}\n\n"
        f"Total Price: {total_price}\n\n"
        f"Number of Items: {number_of_items}\n\n"
        ###
    )
    
    ###
    ## Now, we will send the invoice as an email with a PDF attachment

    # Email account credentials
    sender_email = "susold78@gmail.com"
    sender_password = "eoiz jtje lhyv lhsn"
    receiver_email = current_user["email"]

    # Generate PDF from message string
    pdf_buffer = BytesIO()
    p = canvas.Canvas(pdf_buffer)
    text_object = p.beginText(40, 800)  # Starting position

    for line in message.split("\n"):
        text_object.textLine(line)
    p.drawText(text_object)
    p.showPage()
    p.save()
    pdf_buffer.seek(0)

    # Create the email with attachment
    msg = MIMEMultipart()
    msg["Subject"] = "SUSOLD Invoice"
    msg["From"] = sender_email
    msg["To"] = receiver_email

    # Add a plain-text fallback message
    msg.attach(MIMEText("Please find your invoice attached as a PDF."))

    # Add PDF attachment
    pdf_attachment = MIMEApplication(pdf_buffer.read(), _subtype="pdf")
    pdf_attachment.add_header("Content-Disposition", "attachment", filename="invoice.pdf")
    msg.attach(pdf_attachment)

    # Send the email
    smtp_server = "smtp.gmail.com"
    smtp_port = 587

    server = smtplib.SMTP(smtp_server, smtp_port)
    server.starttls()
    server.login(sender_email, sender_password)
    server.sendmail(sender_email, receiver_email, msg.as_string())
    server.quit()
    ###

    return {"message": message}

def clean_document(doc):
    doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
    return doc

@router.get("/order-history")
async def get_order_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    # Fetch all orders by the user
    order_cursor = order_collection.find({"user_id": user_id})
    orders = await order_cursor.to_list(length=None)

    # Aggregate all item_ids from orders
    all_item_ids = []
    for order in orders:
        all_item_ids.extend(order.get("item_ids", []))

    if not all_item_ids:
        return {"order_items": []}

    # Fetch item_name and isSold from item_collection
    items_cursor = item_collection.find(
        {"item_id": {"$in": all_item_ids}},
        {"title": 1, "isSold": 1, "_id": 0}
    )
    items = await items_cursor.to_list(length=None)

    return {"order_items": items}


@router.get("/debug-all")
async def debug_all():
    users = await users_collection.find().to_list(length=None)
    items = await item_collection.find().to_list(length=None)
    orders = await order_collection.find().to_list(length=None)

    # Clean _id fields
    users = [clean_document(doc) for doc in users]
    items = [clean_document(doc) for doc in items]
    orders = [clean_document(doc) for doc in orders]

    return {
        "users": users,
        "items": items,
        "orders": orders
    }


