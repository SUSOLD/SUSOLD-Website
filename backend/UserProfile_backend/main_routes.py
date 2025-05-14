from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import HttpUrl
from typing import List
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from backend.database import users_collection, feedback_collection, item_collection, order_collection, refund_collection
from backend.registerloginbackend.jwt_handler import get_current_user, get_password_hash
from backend.UserProfile_backend.model import FeedbackInput, UserUpdate, RefundRequestBody
from backend.HomePage_backend.app.schemas import ProductCreate as Product
from fastapi.encoders import jsonable_encoder
import smtplib
from email.mime.text import MIMEText
from email.message import EmailMessage

async def send_email_notification(to_email: str, subject: str, body: str):
    sender_email = "susold78@gmail.com"
    sender_password = "eoiz jtje lhyv lhsn"

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email

    # You need to replace with your actual SMTP credentials
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
    except Exception as e:
        print("Email sending failed:", e)


main_router = APIRouter()

# -------------------------------
# Send a feedback to a specific seller
# -------------------------------
@main_router.post("/send_feedback")
async def send_feedback(data: FeedbackInput, current_user: dict = Depends(get_current_user)):
    seller_id = data.seller_id
    sender_id = current_user["user_id"]

    if data.rating is None and (data.comment is None or data.comment.strip() == ""):
        raise HTTPException(status_code=400, detail="At least one of rating or comment must be provided.")

    seller = await users_collection.find_one({"user_id": seller_id})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")

    now = datetime.now(timezone.utc)
    feedback_doc = {
        "rating": data.rating,
        "comment": data.comment,
        "sender_id": sender_id,
        "receiver_id": seller_id,
        "date": now,
        "isCommentVerified": False,
        "item": data.item  # item_id as a string
    }

    await feedback_collection.insert_one(feedback_doc)

    if data.rating is not None:
        current_rating = seller.get("rating", 0.0)
        current_rate_number = seller.get("rate_number", 0)
        new_rate_number = current_rate_number + 1
        new_rating = (current_rating * current_rate_number + data.rating) / new_rate_number
        await users_collection.update_one(
            {"user_id": seller_id},
            {
                "$set": {
                    "rating": new_rating,
                    "rate_number": new_rate_number
                }
            }
        )

    return {
        "message": "Feedback submitted successfully.",
        "new_rating": round(new_rating, 2) if data.rating is not None else seller.get("rating", 0.0),
        "rate_number": new_rate_number if data.rating is not None else seller.get("rate_number", 0)
    }


# -------------------------------
# Show feedbacks for current user
# -------------------------------
@main_router.get("/my_feedbacks")
async def get_my_feedbacks(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    feedbacks = feedback_collection.find({"receiver_id": current_user["user_id"]})
    feedback_list = []
    async for fb in feedbacks:
        fb["_id"] = str(fb["_id"])
        
        # Handle comment display
        if fb.get("comment") and not fb.get("isCommentVerified", False):
            fb["comment"] = "no comment"
        if fb.get("comment") == None:
            fb["comment"] = "no comment"
        feedback_list.append({
            "rating": fb.get("rating"),
            "comment": fb.get("comment"),
            "_id": fb["_id"],
        })

    return {"feedbacks_received": feedback_list}


# -------------------------------
# Show feedbacks for a specific seller
# -------------------------------
@main_router.get("/seller_feedbacks")
async def get_seller_feedbacks(seller_id: str): 
    seller = await users_collection.find_one({"user_id": seller_id})

    feedbacks = feedback_collection.find({"receiver_id": seller["user_id"]})
    feedback_list = []
    async for fb in feedbacks:
        fb["_id"] = str(fb["_id"])
        
        # Handle comment display
        if fb.get("comment") and not fb.get("isCommentVerified", False):
            fb["comment"] = "no comment"
        if fb.get("comment") == None:
            fb["comment"] = "no comment"
        feedback_list.append({
            "rating": fb.get("rating"),
            "comment": fb.get("comment"),
            "_id": fb["_id"],
        })

    return {"feedbacks_received": feedback_list}


# -------------------------------
# Show unapproved comments (PRODUCT MANAGEERRRRR)
# -------------------------------
@main_router.get("/unapproved_comments")
async def get_unapproved_comments(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("isManager", False):
        raise HTTPException(status_code=403, detail="Not authorized to display comments.")

    feedbacks = await feedback_collection.find({"comment": {"$ne": None}, "isCommentVerified": False}).to_list(length=None)

    # Serialize feedbacks (convert ObjectId to string)
    for fb in feedbacks:
        fb["_id"] = str(fb["_id"])

    return {"unapproved_comments": feedbacks}


# -------------------------------
# Mark a product as delivered (PRODUCT MANAGERRR)
# -------------------------------
@main_router.put("/mark_status/{item_id}")
async def update_product_status(item_id: str, status: str, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("isManager", False):
        raise HTTPException(status_code=403, detail="Only product managers are allowed to update product status.")

    valid_statuses = {"processing", "stillInStock", "inTransit", "delivered"}
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    if status in {"processing", "inTransit", "delivered"}:
        await item_collection.update_one(
            {"item_id": item_id},
            {"$set": {"isSold": status, "inStock": False}}
        )
    else:
        await item_collection.update_one(
            {"item_id": item_id},
            {"$set": {"isSold": status, "inStock": True}}
        )

    return {"message": f"Product status updated to '{status}' successfully."}


# -------------------------------
# Approve a comment (PRODUCT MANAGERR)
# -------------------------------
@main_router.post("/approve_comment/{feedback_id}")
async def approve_comment(feedback_id: str, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("isManager", False):
       raise HTTPException(status_code=403, detail="Not authorized to approve a comment.")

    try:
        feedback_obj_id = ObjectId(feedback_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid feedback ID format.")

    result = await feedback_collection.update_one(
        {"_id": feedback_obj_id, "comment": {"$ne": None}},
        {"$set": {"isCommentVerified": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found or no comment to approve.")

    return {"message": "Comment approved successfully."}


# -------------------------------
# Remove a comment (PRODUCT MANAGERRR)
# -------------------------------
@main_router.delete("/remove_comment/{feedback_id}")
async def remove_comment(feedback_id: str, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.get("isManager", False):
        raise HTTPException(status_code=403, detail="Not authorized to remove comments.")

    try:
        feedback_obj_id = ObjectId(feedback_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid feedback ID format.")

    result = await feedback_collection.update_one(
        {"_id": feedback_obj_id, "comment": {"$ne": None}},
        {"$set": {"comment": None, "isCommentVerified": False}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found or already removed.")

    return {"message": "Comment removed successfully."}


# -------------------------------
# Display isManager value of the user
# -------------------------------
@main_router.get("/is_manager")
async def is_user_manager(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
     
    is_manager = user.get("isManager", False)
    return {"is_manager": is_manager}


# -------------------------------
# Display isSalesManager value of the user
# -------------------------------
@main_router.get("/is_sales_manager")
async def is_user_sales_manager(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
     
    is_sales_manager = user.get("isSalesManager", False)
    return {"is_sales_manager": is_sales_manager}


# -------------------------------
# Return name and lastname of current user
# -------------------------------
@main_router.get("/my_name")
async def get_my_name(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"name": user.get("name"), "lastname": user.get("lastname")}


# -------------------------------
# Show photo of the user
# -------------------------------
@main_router.get("/current_photo")
async def get_current_photo(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    photo_url = user.get("photo", [])
    return {"photo_url": photo_url}


# -------------------------------
# Show current rating the user
# -------------------------------
@main_router.get("/current_rating")
async def get_current_rating(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"current_rating": user.get("rating", 0.0)}


# -------------------------------
# Display is_Verified value of the user
# -------------------------------
@main_router.get("/is_verified")
async def is_user_verified(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_verified = user.get("is_Verified", False)
    return {"is_verified": is_verified}


# -------------------------------
# Diplay offerred products
# -------------------------------
@main_router.get("/my_offerings")
async def get_my_offerings(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    offerings_cursor = item_collection.find({"user_id": current_user["user_id"]})
    offerings = await offerings_cursor.to_list(length=None)

    for offering in offerings:
        offering["_id"] = str(offering["_id"])

    return {"offerings": offerings}


# -------------------------------
# Add a product to the offerings of the user
# -------------------------------
@main_router.post("/add_to_offerings")
async def add_to_offerings(product: Product, current_user: dict = Depends(get_current_user)):

    if isinstance(product_dict.get("image"), HttpUrl):
        product_dict["image"] = str(product_dict["image"])

    product_dict = product.model_dump()
    insert_result = await item_collection.insert_one(product_dict)
    product_id = insert_result.inserted_id

    new_product = await item_collection.find_one({"item_id": product_id})
    if not new_product:
        raise HTTPException(status_code=500, detail="Failed to create product.")

    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "offeredProducts" not in user:
        user["offeredProducts"] = []
 
    user["offeredProducts"].append(new_product)
    await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"offeredProducts": user["offeredProducts"]}}
    )

    return {"message": "Product created and added to offerings."}


# -------------------------------
# Remove a product from the offerings of the user
# -------------------------------
@main_router.post("/remove_from_offerings")
async def remove_from_offerings(product_id: str, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    delete_result = await item_collection.delete_one({
        "user_id": current_user["user_id"],
        "item_id": product_id
    })

    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found or not authorized to delete")

    return {"message": "Product removed from offerings"}

# -------------------------------
# Show favorite products
# -------------------------------
@main_router.get("/my_favorites")
async def get_my_favorites(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    favorite_ids = user.get("favorites", [])

    # Fetch all favorite products by their item_id
    favorite_products = []
    for item_id in favorite_ids:
        product = await item_collection.find_one({"item_id": item_id})
        if product:
            
            if "_id" in product and isinstance(product["_id"], ObjectId):
                product["_id"] = str(product["_id"])
            favorite_products.append(product)

    return {"favorites": favorite_products}


# -------------------------------
# Add a product to favorites
# -------------------------------
@main_router.post("/add_to_favorites")
async def add_to_favorites(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await item_collection.find_one({"item_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "favorites" not in user:
        user["favorites"] = []

    if product_id in user["favorites"]:
        raise HTTPException(status_code=400, detail="Product already in favorites")

    user["favorites"].append(product_id)
    await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"favorites": user["favorites"]}}
    )

    return {"message": "Product added to favorites"}


# -------------------------------
# Remove a product from favorites
# -------------------------------
@main_router.post("/remove_from_favorites")
async def remove_from_favorites(product_id: str, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    favorites = user.get("favorites", [])

    if product_id not in favorites:
        raise HTTPException(status_code=400, detail="Product not found in favorites")

    updated_favorites = [p for p in favorites if p != product_id]

    await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"favorites": updated_favorites}}
    )

    return {"message": "Product removed from favorites"}


# -------------------------------
# Remove a product from favorites
# -------------------------------
@main_router.put("/update_user_info")
async def update_user_info(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user.get("user_id")

    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data provided for update.")

    try:
        validated = UserUpdate(**update_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if "password" in update_dict:
        update_dict["password"] = get_password_hash(update_dict["password"])

    await users_collection.update_one({"user_id": current_user["user_id"]}, {"$set": update_dict})

    return {"message": "User information updated successfully"}


# -------------------------------
# Display all purchased products - ADD DATES AND STATUS TO ORDER MODEL, THEN UPDATE THE CODE
# -------------------------------
@main_router.get("/purchased-products")
async def get_purchased_products(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    orders_cursor = order_collection.find({"user_id": user["user_id"]})
    orders = await orders_cursor.to_list(length=100)

    if not orders:
        return []

    purchased_items = []
    for order in orders:
        purchased_items.extend(order.get("item_ids", []))

    return purchased_items

@main_router.get("/user-orders")
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    orders_cursor = order_collection.find({"user_id": user["user_id"]})
    orders = await orders_cursor.to_list(length=100)

    if not orders:
        return []

    result = []
    for order in orders:
        order_id = order.get("order_id")
        order_date = order.get("date")
        item_ids = order.get("item_ids", [])
        
        # Her siparişin durumunu belirlemek için siparişte bulunan ürünlerin durumlarını kontrol et
        items_status = []
        for item_id in item_ids:
            item = await item_collection.find_one({"item_id": item_id})
            if item:
                items_status.append(item.get("isSold", "processing"))
        
        # Sipariş durumunu belirle (en düşük durum öncelikli)
        status = "delivered"  # Varsayılan olarak teslim edildi kabul et
        if "processing" in items_status:
            status = "processing"  # Eğer herhangi bir ürün işlemde ise, sipariş işlemde
        elif "inTransit" in items_status:
            status = "inTransit"  # Eğer herhangi bir ürün kargoda ise ve işlemde olan yoksa, sipariş kargoda

        refund_request = await refund_collection.find_one({"order_id": order_id})
        if refund_request:
            refund_status = refund_request.get("status", "pending")
        else:
            refund_status = "notSent"

        result.append({
            "order_id": order_id,
            "date": order_date,
            "status": status,
            "refund_status": refund_status,
            "item_ids": item_ids
        })

    return result

@main_router.get("/all-orders")
async def get_all_orders(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Sadece product manager'lar tüm siparişleri görebilir
    if not user.get("isManager", False):
        raise HTTPException(status_code=403, detail="Only product managers can view all orders")
    
    # Tüm siparişleri getir
    orders_cursor = order_collection.find({})
    orders = await orders_cursor.to_list(length=1000)
    
    result = []
    for order in orders:
        # Siparişin temel bilgilerini al
        order_data = {
            "order_id": order.get("order_id"),
            "user_id": order.get("user_id"),
            "date": order.get("date"),
            "items": []
        }
        
        # Her siparişteki ürünleri getir
        for item_id in order.get("item_ids", []):
            item = await item_collection.find_one({"item_id": item_id})
            if item:
                order_data["items"].append({
                    "item_id": item.get("item_id"),
                    "title": item.get("title"),
                    "image": item.get("image", [None])[0],  # İlk resmi al veya None
                    "price": item.get("price"),
                    "category": item.get("category"),
                    "status": item.get("isSold", "processing"),
                    "inStock": item.get("inStock", False)
                })
        
        result.append(order_data)
    
    return result


# -------------------------------
# Cancel an order if the status is 'processing'
# -------------------------------
@main_router.post("/cancel-order/{order_id}")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await order_collection.find_one({"order_id": order_id, "user_id": current_user["user_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    item_ids = order.get("item_ids", [])
    
    # Check if all items are still in 'processing'
    for item_id in item_ids:
        product = await item_collection.find_one({"item_id": item_id})
        if not product or product.get("isSold") != "processing":
            raise HTTPException(status_code=400, detail="Order cannot be canceled. One or more items are already processed.")
    
    await order_collection.delete_one({"order_id": order_id})

    for item_id in item_ids:
        await item_collection.update_one({"item_id": item_id}, {"$set": {"isSold": "stillInStock", "inStock": True}})

    return {"message": f"Order {order_id} has been successfully canceled."}


# -------------------------------
# Get refunded products of the user
# -------------------------------
@main_router.get("/my-refunded-items")
async def get_my_refunded_items(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    refunds_cursor = refund_collection.find({"user_id": current_user["user_id"], "status": "approved"})
    refunds = await refunds_cursor.to_list(length=None)

    refunded_items = []
    for refund in refunds:
        refunded_items.extend(refund.get("item_ids", []))

    return {"refunded_item_ids": refunded_items}


# -------------------------------
# Send a refund request if the status is 'delivered' and it's been less than 30 days
# -------------------------------
@main_router.post("/refund-request/{order_id}")
async def submit_refund_request(order_id: str, body: RefundRequestBody, current_user: dict = Depends(get_current_user)):
    order = await order_collection.find_one({"order_id": order_id, "user_id": current_user["user_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    item_ids = body.item_ids

    purchase_date = order.get("date")
    if not isinstance(purchase_date, datetime):
        raise HTTPException(status_code=400, detail="Invalid purchase date in database")

    # 🔧 purchase_date aware mı? değilse UTC olarak kabul et
    if purchase_date.tzinfo is None:
        purchase_date = purchase_date.replace(tzinfo=timezone.utc)

    # ✅ Artık güvenli şekilde kıyas yapılabilir
    if datetime.now(timezone.utc) - purchase_date > timedelta(days=30):
        raise HTTPException(status_code=400, detail="Refund period has expired (more than 30 days since purchase)")

    # Ürün kontrolü
    if any(item not in order.get("item_ids", []) for item in item_ids):
        raise HTTPException(status_code=400, detail="Some items do not belong to the order")

    total_price = 0
    for item_id in item_ids:
        product = await item_collection.find_one({"item_id": item_id})
        if not product or product.get("isSold") != "delivered":
            raise HTTPException(status_code=400, detail=f"Product {item_id} is not eligible for return")
        total_price += product.get("price", 0)

    request_doc = {
        "user_id": current_user["user_id"],
        "item_ids": item_ids,
        "order_id": order_id,
        "total_price": total_price,
        "refund_amount": total_price,
        "status": "pending"
    }

    await refund_collection.insert_one(request_doc)
    return {"message": "Refund request submitted and pending review."}

# -------------------------------
# Approve/reject refund requests - SALES MANAGEEERRRRR
# -------------------------------
@main_router.post("/handle-refund-request/{order_id}")
async def handle_refund(order_id: str, action: str = Query(...), current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can handle refunds.")

    request = await refund_collection.find_one({"order_id": order_id})
    if not request:
        raise HTTPException(status_code=404, detail="Refund request not found")

    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Refund request already processed")

    user = await users_collection.find_one({"user_id": request["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if action == "approve":
        for item_id in request["item_ids"]:
            await item_collection.update_one(
                {"item_id": item_id},
                {"$set": {"inStock": True, "isSold": "stillInStock"}}
            )
        await refund_collection.update_one(
            {"order_id": order_id},
            {"$set": {"status": "approved"}}
        )

        # Send email
        subject = "Your refund request has been approved"
        body = (
            f"Hello {user['name']},\n\n"
            f"Your refund request for Order ID {order_id} has been approved.\n"
            f"Refunded amount: {request['refund_amount']} TL\n"
            f"Items: {', '.join(request['item_ids'])}\n\n"
            "Thank you for using suSold."
        )
        await send_email_notification(user["email"], subject, body)

        return {"message": "Refund approved and user notified."}

    elif action == "reject":
        await refund_collection.update_one(
            {"order_id": order_id},
            {"$set": {"status": "rejected"}}
        )

        subject = "Your refund request has been rejected"
        body = (
            f"Hello {user['name']},\n\n"
            f"Your refund request for Order ID {order_id} has been rejected.\n"
            "Please contact support for more information.\n\n"
            "Thank you."
        )
        await send_email_notification(user["email"], subject, body)

        return {"message": "Refund rejected and user notified."}
    
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'.")


# -------------------------------
# Set price of a specific product - SALES MANAGEEERRRRR
# -------------------------------
@main_router.post("/set-price/{item_id}")
async def set_product_price(item_id: str, price: float, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can set prices.")

    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if product.get("price") != 0:
        raise HTTPException(status_code=400, detail="Product already has a price.")

    await item_collection.update_one({"item_id": item_id},{"$set": {"price": price}})
    
    return {"message": f"Price for product {item_id} set to {price} successfully."}


# -------------------------------
# Get items without a price - SALES MANAGEEERRRRR
# -------------------------------
@main_router.get("/items-without-price")
async def get_items_without_price(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Sadece Sales Manager'lar fiyatsız ürünleri görebilir
    if not user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can view products without prices")
    
    # Fiyatı olmayan veya fiyatı 0 olan ürünleri bul
    query = {"$or": [{"price": {"$exists": False}}, {"price": None}, {"price": 0}]}
    items_cursor = item_collection.find(query)
    items = await items_cursor.to_list(length=1000)
    
    # Daha fazla bilgi içeren bir response oluştur
    items_with_detail = []
    for item in items:
        items_with_detail.append({
            "item_id": item.get("item_id"),
            "title": item.get("title"),
            "description": item.get("description"),
            "category": item.get("category"),
            "condition": item.get("condition"),
            "image": item.get("image", [None])[0],  # İlk resmi al veya None
            "inStock": item.get("inStock", True)
        })
    
    return {"items_with_no_price": items_with_detail}

# -------------------------------
# Display refund requests - SALES MANAGEEERRRRR
# -------------------------------
def serialize_mongo_document(doc):
    """Convert ObjectId fields in a MongoDB document to strings."""
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "user_id" in doc and isinstance(doc["user_id"], ObjectId):
        doc["user_id"] = str(doc["user_id"])
    return doc

@main_router.get("/refund-requests")
async def view_refund_requests(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("isSalesManager", False):
        raise HTTPException(status_code=403, detail="Only sales managers can view refund requests.")
    
    requests = await refund_collection.find({"status": "pending"}).to_list(length=100)
    
    serialized_requests = [serialize_mongo_document(r) for r in requests]
    return serialized_requests


