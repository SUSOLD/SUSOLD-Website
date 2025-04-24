from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.database import users_collection, item_collection
from backend.registerloginbackend.jwt_handler import get_current_user

router = APIRouter()

# ------------------------- GET Basket Items -------------------------
@router.get("/basket")
async def get_basket(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to access basket.")

    user_id = current_user.get("user_id")
    user = await users_collection.find_one({"user_id": user_id})

    if not user or "basket" not in user:
        return {"basket": []}

    item_ids = user.get("basket", [])
    items = []
    for item_id in item_ids:
        item = await item_collection.find_one({"item_id": item_id})
        if item:
            item["_id"] = str(item["_id"])
            items.append(item)

    return {"basket": items}

# ------------------------- POST Add/Toggle Item -------------------------
@router.post("/basket/{item_id}")
async def toggle_basket_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to modify basket.")

    user_id = current_user.get("user_id")
    user = await users_collection.find_one({"user_id": user_id})

    if not user:
        await users_collection.insert_one({
            "user_id": user_id,
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

    await users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"basket": list(current_basket)}}
    )

    return {"basket": list(current_basket)}

# ------------------------- DELETE Remove Specific -------------------------
@router.delete("/basket/{item_id}")
async def remove_from_basket(item_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required to modify basket.")

    user_id = current_user.get("user_id")
    user = await users_collection.find_one({"user_id": user_id})

    if not user or "basket" not in user:
        return {"message": "User not found or basket empty."}

    basket = set(user["basket"])
    if item_id in basket:
        basket.remove(item_id)
        await users_collection.update_one(
            {"user_id": user_id},
            {"$set": {"basket": list(basket)}}
        )
        return {"message": "Removed from basket"}

    return {"message": "Item not in basket"}
