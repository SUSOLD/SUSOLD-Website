from fastapi import APIRouter, HTTPException, Depends
from app.database import item_collection, users_collection
from bson import ObjectId
from backend.registerloginbackend.jwt_handler import get_current_user

router = APIRouter()

# ------------------------- GET Favorites -------------------------
@router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user = await users_collection.find_one({"user_id": user_id})
    if not user or "favorites" not in user:
        return {"favorites": []}

    items = []
    for fav_id in user["favorites"]:
        product = await item_collection.find_one({"item_id": fav_id})
        if product:
            product["item_id"] = product.get("item_id", str(product["_id"]))
            product["_id"] = str(product["_id"])
            items.append(product)
    return {"favorites": items}

# ------------------------- POST Toggle Favorite -------------------------
@router.post("/favorites/{item_id}")
async def add_to_favorites(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user = await users_collection.find_one({"user_id": user_id})

    if not user:
        await users_collection.insert_one({"user_id": user_id, "favorites": [item_id]})
    else:
        favorites = set(user.get("favorites", []))
        if item_id in favorites:
            favorites.remove(item_id)
        else:
            favorites.add(item_id)
        await users_collection.update_one(
            {"user_id": user_id},
            {"$set": {"favorites": list(favorites)}}
        )
    return {"message": "Favorite status updated"}

# ------------------------- DELETE Remove from Favorites -------------------------
@router.delete("/favorites/{item_id}")
async def remove_from_favorites(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    await users_collection.update_one(
        {"user_id": user_id},
        {"$pull": {"favorites": item_id}}
    )
    return {"message": "Removed from favorites"}
