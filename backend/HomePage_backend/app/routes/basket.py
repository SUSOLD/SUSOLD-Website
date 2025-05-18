from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from backend.database import users_collection, item_collection, order_collection
from backend.registerloginbackend.jwt_handler import get_current_user

router = APIRouter()

# ------------------------- GET Basket Items -------------------------
@router.get("/basket")
async def get_basket(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user = await users_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    item_ids = user.get("basket", [])
    items = []
    for item_id in item_ids:
        item = await item_collection.find_one(
            {"item_id": item_id},
            {"_id": 0, "item_id": 1, "title": 1, "price": 1, "isSold": 1}
        )
        if item:
            items.append(item)

    return {"basket": items}

# ------------------------- POST Add to Basket -------------------------
@router.post("/basket/{item_id}")
async def add_to_basket(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await users_collection.update_one(
        {"user_id": user_id},
        {"$addToSet": {"basket": item_id}}
    )

    return {"message": "Item added to basket"}

# ------------------------- DELETE Remove from Basket -------------------------
@router.delete("/basket/{item_id}")
async def remove_from_basket(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    await users_collection.update_one(
        {"user_id": user_id},
        {"$pull": {"basket": item_id}}
    )

    return {"message": "Item removed from basket"}

@router.get("/get_in_stock")
async def get_in_stock(item_id: str):
    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.get("inStock", True)



@router.get("/is_delivered")
async def get_is_delivered(item_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    user = await users_collection.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Step 1: Check if the user has bought the item
    order = await order_collection.find_one({
        "user_id": user_id,
        "item_ids": {"$in": [item_id]}
    })

    if not order:
        return False

    # Step 2: Check if the product is marked as "delivered"
    product = await item_collection.find_one({"item_id": item_id})

    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    return product.get("isSold") == "delivered"


@router.get("/is_processing")
async def is_item_processing(item_id: str, current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"user_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    item = await item_collection.find_one({"item_id": item_id})
    
    if not item:
        raise HTTPException(status_code=404, detail="Product not found") 
    
    return item.get("isSold") == "processing"