from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.database import users_collection, items_collection

router = APIRouter()

DEFAULT_USER_ID = "default"  # You can later replace this with actual user session logic

# ------------------------- GET Basket Items -------------------------
@router.get("/basket")
def get_basket():
    user = users_collection.find_one({"_id": DEFAULT_USER_ID})
    if not user or "basket" not in user:
        return {"basket": []}

    item_ids = user["basket"]
    items = []
    for item_id in item_ids:
        item = items_collection.find_one({"item_id": item_id})
        if item:
            item["_id"] = str(item["_id"])
            items.append(item)
    return {"basket": items}

# ------------------------- POST Add/Toggle Item -------------------------
@router.post("/basket/{item_id}")
def toggle_basket_item(item_id: str):
    user = users_collection.find_one({"_id": DEFAULT_USER_ID})
    if not user:
        users_collection.insert_one({
            "_id": DEFAULT_USER_ID,
            "basket": [item_id],
            "favorites": [],
            "offeredProducts": []
        })
        return {"basket": [item_id]}

    current_basket = set(user.get("basket", []))

    if item_id in current_basket:
        current_basket.remove(item_id)
    else:
        current_basket.add(item_id)

    users_collection.update_one(
        {"_id": DEFAULT_USER_ID},
        {"$set": {"basket": list(current_basket)}}
    )

    return {"basket": list(current_basket)}

# ------------------------- DELETE Remove Specific -------------------------
@router.delete("/basket/{item_id}")
def remove_from_basket(item_id: str):
    user = users_collection.find_one({"_id": DEFAULT_USER_ID})
    if not user or "basket" not in user:
        return {"message": "User not found or basket empty."}

    basket = set(user["basket"])
    if item_id in basket:
        basket.remove(item_id)
        users_collection.update_one(
            {"_id": DEFAULT_USER_ID},
            {"$set": {"basket": list(basket)}}
        )
        return {"message": "Removed from basket"}

    return {"message": "Item not in basket"}
