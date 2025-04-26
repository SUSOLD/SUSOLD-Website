from fastapi import APIRouter, HTTPException, Depends
from database import item_collection, users_collection
from bson import ObjectId
from registerloginbackend.jwt_handler import get_current_user

router = APIRouter()

# ------------------------- GET Favorites -------------------------
@router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    user = await users_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    favorite_ids = user.get("favorites", [])
    favorites = []

    for fav_id in favorite_ids:
        product = await item_collection.find_one({"item_id": fav_id})
        if product:
            product["_id"] = str(product["_id"])
            favorites.append(product)

    return {"favorites": favorites}

# ------------------------- POST Add to Favorites -------------------------
@router.post("/favorites/{item_id}")
async def add_to_favorites(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await users_collection.update_one(
        {"user_id": user_id},
        {"$addToSet": {"favorites": item_id}}
    )

    return {"message": "Item added to favorites"}

# ------------------------- DELETE Remove from Favorites -------------------------
@router.delete("/favorites/{item_id}")
async def remove_from_favorites(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    await users_collection.update_one(
        {"user_id": user_id},
        {"$pull": {"favorites": item_id}}
    )

    return {"message": "Item removed from favorites"}
