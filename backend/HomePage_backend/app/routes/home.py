from io import BytesIO
from tkinter import Canvas
from bson import ObjectId
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from backend.database import item_collection, users_collection, order_collection, category_collection
from backend.HomePage_backend.app.schemas import ProductCreate, ProductUpdate, CategoryModel
from datetime import datetime, time, timezone
from backend.registerloginbackend.jwt_handler import get_current_user
import smtplib
from email.mime.text import MIMEText
from email.message import EmailMessage
from fastapi.responses import StreamingResponse


router = APIRouter()

# ------------------------- sneding discount email -------------------------
async def send_discount_email(to_email: str, product_title: str, old_price: float, discounted_price: float):
    sender_email = "susold78@gmail.com"
    sender_password = "eoiz jtje lhyv lhsn"

    msg = EmailMessage()
    msg.set_content(
        f"The product '{product_title}' in your wishlist has a new discount!\n\n"
        f"Old Price: {old_price} TL\n"
        f"New Price: {discounted_price} TL\n\n"
        f"Visit SUSOLD to purchase it before the discount ends!"
    )
    msg["Subject"] = "SUSOLD Discount Alert"
    msg["From"] = sender_email
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
    except Exception as e:
        print("Failed to send discount email:", e)

# ------------------------- GET: List Products -------------------------
@router.get("/home/")
async def get_home_data(
    title: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    condition: Optional[str] = Query(None),
    age: Optional[int] = Query(None),
    course: Optional[bool] = Query(None),
    dorm: Optional[bool] = Query(None),
    verified: Optional[bool] = Query(None),
    inStock: Optional[bool] = Query(None),        
    available_now: Optional[bool] = Query(None),
    isSold: Optional[str] = Query(None),          
    returnable: Optional[bool] = Query(None),
    description: Optional[str] = Query(None, max_length=200),
    image: Optional[str] = Query(None),
    item_id: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
):
    query = {}

    if title:
        query["title"] = {"$regex": title, "$options": "i"}
    if category:
        query["category"] = category
    if sub_category:
        query["sub_category"] = sub_category
    if brand:
        query["brand"] = brand
    if price is not None:
        query["price"] = price
    if min_price is not None or max_price is not None:
        query.setdefault("price", {})
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if condition:
        query["condition"] = condition
    if age is not None:
        query["age"] = age
    if course is not None:
        query["course"] = course
    if dorm is not None:
        query["dorm"] = dorm
    if verified is not None:
        query["verified"] = verified
    if inStock is not None:
        query["inStock"] = inStock
    if available_now is not None:
        query["available_now"] = available_now
    if isSold:
        query["isSold"] = isSold
    if returnable is not None:
        query["returnable"] = returnable
    if description:
        query["description"] = {"$regex": description, "$options": "i"}
    if image:
        query["image"] = {"$regex": image, "$options": "i"}
    if item_id:
        query["item_id"] = item_id

    query["price"] = {"$gt": 0}

    sort_order = []
    if sort_by == "price_asc":
        sort_order.append(("price", 1))
    elif sort_by == "price_desc":
        sort_order.append(("price", -1))
    elif sort_by == "popularity":
        sort_order.append(("likes", -1))
    elif sort_by == "newest":
        sort_order.append(("created_at", -1))

    cursor = item_collection.find(query)
    if sort_order:
        cursor = cursor.sort(sort_order)

    products = []
    async for product in cursor:
        product["item_id"] = product.get("item_id", str(product["_id"]))
        product["_id"] = str(product["_id"])
        products.append(product)

    return {"featured_products": products}


# ------------------------- GET: Product by item_id (PUBLIC) -------------------------
@router.get("/home/item/{item_id}")
async def get_product_by_item_id(item_id: str):
    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["_id"] = str(product["_id"])
    return product


# ------------------------- GET: Product by title (PUBLIC) -------------------------
@router.get("/home/title/{title}")
async def get_product_id_by_title(title: str):
    product = await item_collection.find_one({"title": title})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"item_id": product.get("item_id", str(product["_id"]))}


# ------------------------- POST: Add Product (LOGIN REQUIRED) -------------------------
@router.post("/home/")
async def add_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_dict = product.dict()
    product_dict["image"] = str(product_dict.get("image"))
    product_dict["user_id"] = current_user["user_id"]

    product_dict["price"] = 0

    if not product_dict.get("isSold"):
        product_dict["isSold"] = "stillInStock"

    if product_dict.get("warranty_expiry"):
        product_dict["warranty_expiry"] = datetime.combine(product_dict["warranty_expiry"], time.min)

    await item_collection.insert_one(product_dict)

    await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$push": {"offeredProducts": product_dict["item_id"]}}
    )

    return {"message": "Product added successfully", "item_id": product_dict["item_id"]}



# ------------------------- PUT: Update Product (LOGIN REQUIRED) -------------------------
@router.put("/home/{item_id}")
async def update_product(item_id: str, update_data: ProductUpdate, current_user: dict = Depends(get_current_user)):
    existing_item = await item_collection.find_one({"item_id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Product not found")

    if existing_item.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this product")

    update_fields = update_data.dict(exclude_unset=True)
    if "image" in update_fields:
        update_fields["image"] = str(update_fields["image"])

    if "price" in update_fields and not current_user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can update price.")

    if "isSold" in update_fields and not current_user.get("isManager", False):
        raise HTTPException(status_code=403, detail="Only product managers can update delivery status.")

    await item_collection.update_one(
        {"item_id": item_id},
        {"$set": update_fields}
    )

    return {"message": "Product updated successfully"}


# ------------------------- Delete Product (owner or product manager) -------------------------
@router.delete("/home/{item_id}")
async def delete_product(item_id: str, current_user: dict = Depends(get_current_user)):
    existing_item = await item_collection.find_one({"item_id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Product not found")

    is_owner = existing_item.get("user_id") == current_user["user_id"]
    is_manager = current_user.get("isManager", False)

    if not is_owner and not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")

    await item_collection.delete_one({"item_id": item_id})

    await users_collection.update_many(
        {},  # all users
        {
            "$pull": {
                "offeredProducts": item_id,
                "basket": item_id,
                "favorites": item_id
            }
        }
    )

    return {"message": "Product deleted successfully and removed from all user data"}





#------discount method ---------

@router.post("/home/set-discount/{item_id}")
async def set_discount(item_id: str, discount_rate: float = Query(...), current_user: dict = Depends(get_current_user)):
    if not current_user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can set discounts.")

    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    old_price = product.get("price", 0)
    if old_price <= 0:
        raise HTTPException(status_code=400, detail="Cannot apply discount to product with price 0")

    discounted_price = round(old_price * (1 - discount_rate), 2)

    await item_collection.update_one(
        {"item_id": item_id},
        {"$set": {"discount_rate": discount_rate, "discounted_price": discounted_price}}
    )

    users_cursor = users_collection.find({"favorites": item_id})
    async for user in users_cursor:
        await send_discount_email(user["email"], product["title"], old_price, discounted_price)

    return {"message": f"Discount applied. New price: {discounted_price} TL"}


#------ sales summary method -------

@router.get("/home/sales-summary")
async def sales_summary(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can view sales summary.")

    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    orders = await order_collection.find({
        "date": {"$gte": start_dt, "$lte": end_dt}
    }).to_list(None)

    total_revenue = 0
    total_cost = 0

    for order in orders:
        total_revenue += order.get("total_price", 0)
        for item_id in order.get("item_ids", []):
            item = await item_collection.find_one({"item_id": item_id})
            if item:
                sale_price = item.get("price", 0)
                cost = item.get("cost", sale_price * 0.5)  # fallback to 50% if no cost field
                total_cost += cost

    total_profit = total_revenue - total_cost

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_profit, 2)
    }

#-----view the invoices in data range----
@router.get("/home/invoices")
async def get_invoices_by_date(
    start_date: str,
    end_date: str,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can view invoices.")

    from datetime import datetime, timezone

    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    orders = await order_collection.find({
        "date": {"$gte": start_dt, "$lte": end_dt}
    }).to_list(None)

    results = []
    for order in orders:
        results.append({
            "order_id": order["order_id"],
            "user_id": order["user_id"],
            "date": order["date"],
            "total_price": order["total_price"],
            "number_of_items": order["number_of_items"]
        })

    return {"invoices": results}


#----saving and printing invoiced pdf's---------
@router.get("/home/invoice-pdf/{order_id}")
async def download_invoice_pdf(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await order_collection.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Only sales manager or order owner can access
    if current_user["user_id"] != order["user_id"] and not current_user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Not authorized to download this invoice.")

    # Get item details
    item_ids = order.get("item_ids", [])
    item_docs = await item_collection.find({"item_id": {"$in": item_ids}}).to_list(length=None)
    item_names = [item["title"] for item in item_docs]

    # Build message
    message = (
        f"Invoice for Order ID: {order['order_id']}\n\n"
        f"User ID: {order['user_id']}\n"
        f"Date: {order['date']}\n\n"
        f"Purchased Items:\n- " + "\n- ".join(item_names) + "\n\n"
        f"Shipping Address: {order['shipping_address']}\n"
        f"Payment Info: {order['payment_info']}\n\n"
        f"Total Price: {order['total_price']}\n"
        f"Number of Items: {order['number_of_items']}\n"
    )

    # Generate PDF in memory
    pdf_buffer = BytesIO()
    p = Canvas.Canvas(pdf_buffer)
    text_object = p.beginText(40, 800)
    for line in message.split("\n"):
        text_object.textLine(line)
    p.drawText(text_object)
    p.showPage()
    p.save()
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{order_id}.pdf"}
    )


#----creating new category---
@router.post("/categories")
async def create_category(category: CategoryModel, current_user: dict = Depends(get_current_user)):
    if not current_user.get("isManager", False):
        raise HTTPException(status_code=403, detail="Only product managers can create categories.")

    existing = await category_collection.find_one({"name": category.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists.")

    await category_collection.insert_one({"name": category.name})

    return {"message": f"Category '{category.name}' created successfully."}
