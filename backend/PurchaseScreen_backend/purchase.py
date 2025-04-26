from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson.objectid import ObjectId
from backend.database import users_collection, order_collection, cart_collection, item_collection
from backend.registerloginbackend.jwt_handler import get_current_user
import random
import json
from fastapi.responses import PlainTextResponse

router = APIRouter()


class PurchaseData(BaseModel):
    selected_address: str
    selected_credit_card: str


@router.get("/get-user-data")
def get_user_data(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user = users_collection.find_one({"user_id": user_id})
    print("User fetched from DB:", user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "addresses": user.get("addresses", []),
        "credit_cards": user.get("credit_cards", [])
    }


@router.post("/complete-purchase")
def complete_purchase(data: PurchaseData, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    cart_items = list(cart_collection.find({"user_id": user_id}))
    if not cart_items:
        raise HTTPException(status_code=404, detail="Cart is empty")

    order_ids = [doc['order_id'] for doc in order_collection.find({}, {'order_id': 1, '_id': 0})]

    while True:
        order_id_number = random.randint(0, 99999)
        order_id = f"order{order_id_number:05d}"
        if order_id not in order_ids:
            break

    item_ids = [item["item_id"] for item in cart_items]
    items_cursor = item_collection.find({"item_id": {"$in": item_ids}}, {"_id": 0, "item_name": 1})
    item_names = [item["item_name"] for item in items_cursor]

    order_collection.insert_one({
        "order_id": order_id,
        "item_id": item_ids,
        "shipping_address": data.selected_address,
        "payment_info": data.selected_credit_card
    })

    cart_collection.delete_many({"user_id": user_id})

    item_collection.update_many(
    {"item_id": {"$in": item_ids}},    # filter
    {"$set": {"isSold": "processing"}}  # update
    )

    message = (
        "Thank you for your purchase!\n\n"
        "The details of your purchase are as follows:\n\n"
        f"Order ID: {order_id}\n\n"
        f"Purchased Items: {', '.join(item_names)}\n\n"
        f"Payment Info: {data.selected_credit_card}\n\n"
        f"Shipping Address: {data.selected_address}"
    )

    return {"message": message}


@router.get("/get-cart-items")
def get_cart_items(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    cart_items = list(cart_collection.find({"user_id": user_id}, {"_id": 0, "item_id": 1}))
    item_ids = [entry["item_id"] for entry in cart_items]
    items = list(item_collection.find({"item_id": {"$in": item_ids}}, {"_id": 0, "item_name": 1}))

    return [item["item_name"] for item in items]


