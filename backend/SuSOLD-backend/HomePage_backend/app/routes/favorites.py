from fastapi import APIRouter, HTTPException
from app.database import products_collection
from bson import ObjectId

router = APIRouter()

favorites = []

@router.get("/favorites")
def get_favorites():
    items = []
    for fav_id in favorites:
        product = products_collection.find_one({"_id": ObjectId(fav_id)})
        if product:
            product["item_id"] = str(product["_id"])
            del product["_id"]
            items.append(product)
    return {"favorites": items}

@router.post("/favorites/{item_id}")
def add_to_favorites(item_id: str):
    if item_id not in favorites:
        favorites.append(item_id)
    return {"message": "Added to favorites"}

@router.delete("/favorites/{item_id}")
def remove_from_favorites(item_id: str):
    if item_id in favorites:
        favorites.remove(item_id)
    return {"message": "Removed from favorites"}
