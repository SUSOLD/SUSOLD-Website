from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import random

from backend.database import users_collection, order_collection, item_collection
from backend.registerloginbackend.jwt_handler import get_current_user

router = APIRouter()


# Response Models
class CartItemResponse(BaseModel):
    item_names: list[str]

class UserDropdownData(BaseModel):
    credit_cards: list[str]
    addresses: list[str]

class CreateOrderRequest(BaseModel):
    selected_address: str
    selected_credit_card: str

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
    ## Find the data to be shown in the dropdown menus (i.e. the credit cards and addresses of the current user)
    return {
        "credit_cards": current_user.get("credit_cards", []),
        "addresses": current_user.get("addresses", [])
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
    

    ## Generate a row for order_collection
    order_cursor = order_collection.find({}, {'order_id': 1, '_id': 0})
    order_docs = await order_cursor.to_list(length=None)
    order_ids = [doc['order_id'] for doc in order_docs]


    while True:
        order_id_number = random.randint(0, 99999)
        order_id = f"order{order_id_number:05d}"
        if order_id not in order_ids:
            break

    new_order = {
        "order_id": order_id,
        "item_ids": item_ids,
        "shipping_address": data.selected_address,
        "payment_info": data.selected_credit_card,
        "user_id": user_id
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
        f"Shipping Address: {data.selected_address}"
    )

    ## Now, we will send the invoice as an email.
    import smtplib
    from email.mime.text import MIMEText
    
    # Email account credentials
    sender_email = "susold78@gmail.com"
    sender_password = "eoiz jtje lhyv lhsn"
    receiver_email = current_user["email"]
    
    # Create the email
    msg = MIMEText(message)
    msg["Subject"] = "SUSOLD Invoice"
    msg["From"] = sender_email
    msg["To"] = receiver_email
    
    # SMTP server setup (example for Gmail)
    smtp_server = "smtp.gmail.com"
    smtp_port = 587

    # Connect to the server
    server = smtplib.SMTP(smtp_server, smtp_port)
    server.starttls()  # Secure the connection
    server.login(sender_email, sender_password)
            
    # Send the email
    server.sendmail(sender_email, receiver_email, msg.as_string())
    server.quit()

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


