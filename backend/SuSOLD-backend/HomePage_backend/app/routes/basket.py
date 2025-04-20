from fastapi import APIRouter, HTTPException
from app.database import products_collection
from bson import ObjectId

router = APIRouter()

basket = []

@router.get("/basket")
def get_basket():
    items = []
    for item_id in basket:
        product = products_collection.find_one({"_id": ObjectId(item_id)})
        if product:
            product["item_id"] = str(product["_id"])
            del product["_id"]
            items.append(product)
    return {"basket": items}

@router.post("/basket/{item_id}")
def add_to_basket(item_id: str):
    if item_id not in basket:
        basket.append(item_id)
    return {"message": "Added to basket"}

@router.delete("/basket/{item_id}")
def remove_from_basket(item_id: str):
    if item_id in basket:
        basket.remove(item_id)
    return {"message": "Removed from basket"}
