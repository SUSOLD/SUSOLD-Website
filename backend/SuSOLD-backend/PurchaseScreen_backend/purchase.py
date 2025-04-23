from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from bson.objectid import ObjectId
import random
from fastapi.responses import JSONResponse

#
from fastapi.middleware.cors import CORSMiddleware
#
from database import orders, cart
from main import app



USER_ID = 123

class PurchaseData(BaseModel):
    selected_address: str
    selected_credit_card: str



##@app.get("/get-user-data")
##def get_user_data():
##    user = db.users.find_one({"user_id": USER_ID})
##    if not user:
##        raise HTTPException(status_code=404, detail="User not found")
##    
##    return {
##        "addresses": user.get("addresses", []),
##        "credit_cards": user.get("credit_cards", [])
##    }

@app.get("/get-user-data")
def get_user_data():
    user = users_collection.find_one({"user_id": 123})
    print("User fetched from DB:", user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "addresses": user.get("addresses", []),
        "credit_cards": user.get("credit_cards", [])
    }


@app.post("/complete-purchase")
def complete_purchase(data: PurchaseData):
    cart_items = list(cart_collection.find({"user_id": USER_ID}))
    if not cart_items:
        raise HTTPException(status_code=404, detail="Cart is empty")

    item_ids = [item["item_id"] for item in cart_items]
    order_id = random.randint(10000, 99999)

    # Fetch item names from the items collection
    items_cursor = item_collection.find({"item_id": {"$in": item_ids}}, {"_id": 0, "item_name": 1})
    item_names = [item["item_name"] for item in items_cursor]

    # Insert the order
    order_collection.insert_one({
        "order_id": order_id,
        "item_id": item_ids,
        "shipping_address": data.selected_address,
        "payment_info": data.selected_credit_card
    })

    cart_collection.delete_many({"user_id": USER_ID})

    # Build the thank-you message
    message = (
        "Thank you for your purchase!\n\n"
        "The details of your purchase are as follows:\n\n"
        f"Order ID: {order_id}\n\n"
        f"Purchased Items: {', '.join(item_names)}\n\n"
        f"Payment Info: {data.selected_credit_card}\n\n"
        f"Shipping Address: {data.selected_address}"
    )


    return {
        "message": message
    }




from fastapi.responses import PlainTextResponse
import json

@app.get("/print-database", response_class=PlainTextResponse)
def print_database():
    users = list(users_collection.find({}, {"_id": 0}))
    cart = list(cart_collection.find({}, {"_id": 0}))
    items = list(item_collection.find({}, {"_id": 0}))
    orders = list(order_collection.find({}, {"_id": 0}))

    response = "\n--- USERS ---\n" + json.dumps(users, indent=2)
    response += "\n\n--- CART ---\n" + json.dumps(cart, indent=2)
    response += "\n\n--- ITEMS ---\n" + json.dumps(items, indent=2)
    response += "\n\n--- ORDERS ---\n" + json.dumps(bought_items, indent=2)

    return response

@app.get("/get-cart-items")
def get_cart_items():
    # Step 1: Get item_ids in user's cart
    cart_items = list(cart_collection.find({"user_id": 123}, {"_id": 0, "item_id": 1}))
    item_ids = [entry["item_id"] for entry in cart_items]

    # Step 2: Find items in the items collection with those item_ids
    items = list(item_collection.find({"item_id": {"$in": item_ids}}, {"_id": 0, "item_name": 1}))

    return [item["item_name"] for item in items]

