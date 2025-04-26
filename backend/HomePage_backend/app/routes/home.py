from bson import ObjectId
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from database import item_collection, users_collection
from HomePage_backend.app.schemas import ProductCreate, ProductUpdate
from datetime import datetime, time
from registerloginbackend.jwt_handler import get_current_user

router = APIRouter()

# ------------------------- GET: List Products (Homepage - PUBLIC) -------------------------
@router.get("/home/")
async def get_home_data(
    title: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    condition: Optional[str] = Query(None),
    age: Optional[int] = Query(None),
    course: Optional[bool] = Query(None),
    dorm: Optional[bool] = Query(None),
    verified: Optional[bool] = Query(None),
    inStock: Optional[bool] = Query(None),
    available_now: Optional[bool] = Query(None),
    isSold: Optional[bool] = Query(None),
    returnable: Optional[bool] = Query(None),
    description: Optional[str] = Query(None, max_length=200),
    image: Optional[str] = Query(None),
    item_id: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None)
):
    query = {}

    if title:
        query["title"] = {"$regex": title, "$options": "i"}
    if category:
        query["category"] = category
    if sub_category:
        query["sub_category"] = sub_category
    if brand:
        query["brand"] = brand
    if price is not None:
        query["price"] = price
    if min_price is not None or max_price is not None:
        query.setdefault("price", {})
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if condition:
        query["condition"] = condition
    if age is not None:
        query["age"] = age
    if course is not None:
        query["course"] = course
    if dorm is not None:
        query["dorm"] = dorm
    if verified is not None:
        query["verified"] = verified
    if inStock is not None:
        query["inStock"] = inStock
    if available_now is not None:
        query["available_now"] = available_now
    if isSold is not None:
        query["isSold"] = isSold
    if returnable is not None:
        query["returnable"] = returnable
    if description:
        query["description"] = {"$regex": description, "$options": "i"}
    if image:
        query["image"] = {"$regex": image, "$options": "i"}
    if item_id:
        query["item_id"] = item_id

    sort_order = []
    if sort_by == "price_asc":
        sort_order.append(("price", 1))
    elif sort_by == "price_desc":
        sort_order.append(("price", -1))
    elif sort_by == "popularity":
        sort_order.append(("likes", -1))
    elif sort_by == "newest":
        sort_order.append(("created_at", -1))

    cursor = item_collection.find(query)
    if sort_order:
        cursor = cursor.sort(sort_order)

    products = []
    async for product in cursor:
        product["item_id"] = product.get("item_id", str(product["_id"]))
        product["_id"] = str(product["_id"])
        products.append(product)

    return {"featured_products": products}


# ------------------------- GET: Product by item_id (PUBLIC) -------------------------
@router.get("/home/item/{item_id}")
async def get_product_by_item_id(item_id: str):
    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["_id"] = str(product["_id"])
    return product


# ------------------------- GET: Product by title (PUBLIC) -------------------------
@router.get("/home/title/{title}")
async def get_product_id_by_title(title: str):
    product = await item_collection.find_one({"title": title})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"item_id": product.get("item_id", str(product["_id"]))}


# ------------------------- POST: Add Product (LOGIN REQUIRED) -------------------------
@router.post("/home/")
async def add_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_dict = product.dict()
    product_dict["image"] = str(product_dict.get("image"))
    product_dict["user_id"] = current_user["user_id"]  # Save owner info

    if product_dict.get("warranty_expiry"):
        product_dict["warranty_expiry"] = datetime.combine(product_dict["warranty_expiry"], time.min)

    await item_collection.insert_one(product_dict)

    # Add item_id to user's offeredProducts
    await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$push": {"offeredProducts": product_dict["item_id"]}}
    )

    return {"message": "Product added successfully", "item_id": product_dict["item_id"]}


# ------------------------- PUT: Update Product (LOGIN REQUIRED) -------------------------
@router.put("/home/{item_id}")
async def update_product(item_id: str, update_data: ProductUpdate, current_user: dict = Depends(get_current_user)):
    existing_item = await item_collection.find_one({"item_id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Product not found")

    if existing_item.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this product")

    update_fields = update_data.dict(exclude_unset=True)
    if "image" in update_fields:
        update_fields["image"] = str(update_fields["image"])

    await item_collection.update_one(
        {"item_id": item_id},
        {"$set": update_fields}
    )

    return {"message": "Product updated successfully"}


# ------------------------- DELETE: Delete Product (LOGIN REQUIRED) -------------------------
@router.delete("/home/{item_id}")
async def delete_product(item_id: str, current_user: dict = Depends(get_current_user)):
    existing_item = await item_collection.find_one({"item_id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Product not found")

    if existing_item.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")

    await item_collection.delete_one({"item_id": item_id})

    # Also remove from user's offeredProducts
    await users_collection.update_one(
        {"user_id": current_user["user_id"]},
        {"$pull": {"offeredProducts": item_id}}
    )

    return {"message": "Product deleted successfully"}
