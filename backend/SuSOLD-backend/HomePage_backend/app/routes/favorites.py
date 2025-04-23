from fastapi import APIRouter, HTTPException
from app.database import items_collection, users_collection
from bson import ObjectId

router = APIRouter()
DEFAULT_USER_ID = "default"

@router.get("/favorites")
def get_favorites():
    user = users_collection.find_one({"_id": DEFAULT_USER_ID})
    if not user or "favorites" not in user:
        return {"favorites": []}

    items = []
    for fav_id in user["favorites"]:
        product = items_collection.find_one({"item_id": fav_id})
        if product:
            product["item_id"] = product.get("item_id", str(product["_id"]))
            product["_id"] = str(product["_id"])
            items.append(product)
    return {"favorites": items}


@router.post("/favorites/{item_id}")
def add_to_favorites(item_id: str):
    user = users_collection.find_one({"_id": DEFAULT_USER_ID})
    if not user:
        users_collection.insert_one({"_id": DEFAULT_USER_ID, "favorites": [item_id]})
    else:
        if item_id not in user.get("favorites", []):
            users_collection.update_one(
                {"_id": DEFAULT_USER_ID},
                {"$push": {"favorites": item_id}}
            )
    return {"message": "Added to favorites"}


@router.delete("/favorites/{item_id}")
def remove_from_favorites(item_id: str):
    users_collection.update_one(
        {"_id": DEFAULT_USER_ID},
        {"$pull": {"favorites": item_id}}
    )
    return {"message": "Removed from favorites"}
