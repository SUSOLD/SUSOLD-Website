from bson import ObjectId
from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional
from app.database import products_collection, users_collection
from app.schemas import ProductCreate, ProductUpdate
from datetime import datetime, time

router = APIRouter()

# ------------------------- GET: List Products -------------------------
@router.get("/home/")
def get_home_data(
    category: Optional[str] = Query(None),
    subcategory: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    condition: Optional[str] = Query(None),
    age: Optional[str] = Query(None),
    course: Optional[bool] = Query(None),
    dorm: Optional[bool] = Query(None),
    verified: Optional[bool] = Query(None),
    warranty_status: Optional[bool] = Query(None),
    in_stock: Optional[bool] = Query(None),
    available_now: Optional[bool] = Query(None),
    available_after_semester: Optional[bool] = Query(None),
    returnable: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query(None)
):
    query = {}

    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if brand:
        query["brand"] = brand
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if condition:
        query["condition"] = condition
    if age:
        query["age"] = age
    if course is not None:
        query["course"] = course
    if dorm is not None:
        query["dorm"] = dorm
    if verified is not None:
        query["verified"] = verified
    if warranty_status is not None:
        query["warranty_status"] = warranty_status
    if in_stock is not None:
        query["isSold"] = not in_stock
    if available_now is not None:
        query["available_now"] = available_now
    if available_after_semester is not None:
        query["available_after_semester"] = available_after_semester
    if returnable is not None:
        query["returnable"] = returnable

    sort_order = []
    if sort_by == "price_asc":
        sort_order.append(("price", 1))
    elif sort_by == "price_desc":
        sort_order.append(("price", -1))
    elif sort_by == "popularity":
        sort_order.append(("likes", -1))
    elif sort_by == "newest":
        sort_order.append(("created_at", -1))

    cursor = products_collection.find(query)
    if sort_order:
        cursor = cursor.sort(sort_order)

    products = []
    for product in cursor:
        product["item_id"] = str(product["_id"])
        del product["_id"]
        products.append(product)

    return {"featured_products": products}


# ------------------------- GET by Title -------------------------
@router.get("/home/title/{title}")
def get_product_id_by_title(title: str):
    product = products_collection.find_one({"title": title})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"item_id": str(product["_id"])}


# ------------------------- POST -------------------------
@router.post("/home/")
def add_product(product: ProductCreate):
    product_dict = product.dict()
    if product_dict.get("warranty_expiry"):
        product_dict["warranty_expiry"] = datetime.combine(product_dict["warranty_expiry"], time.min)
    result = products_collection.insert_one(product_dict)
    return {"message": "Product added successfully", "item_id": str(result.inserted_id)}


# ------------------------- GET by ID -------------------------
@router.get("/home/item/{item_id}")
def get_product_by_id(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item_id format")

    product = products_collection.find_one({"_id": obj_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product["item_id"] = str(product["_id"])
    del product["_id"]
    return product


# ------------------------- PUT -------------------------
@router.put("/home/{item_id}")
def update_product(item_id: str, update_data: ProductUpdate):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item_id format")

    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if "warranty_expiry" in update_dict and update_dict["warranty_expiry"]:
        update_dict["warranty_expiry"] = datetime.combine(update_dict["warranty_expiry"], time.min)

    result = products_collection.update_one(
        {"_id": obj_id},
        {"$set": update_dict}
    )

    if result.modified_count == 1:
        return {"message": "Product updated successfully"}
    elif result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    else:
        return {"message": "No changes made"}


# ------------------------- DELETE -------------------------
@router.delete("/home/{item_id}")
def delete_product(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item_id format")

    result = products_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 1:
        return {"message": "Product deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Product not found")


# ------------------------- FAVORITES / BASKET -------------------------

@router.post("/user/favorites/{item_id}")
def toggle_favorite(item_id: str):
    users_collection.update_one(
        {"_id": "default"},
        [{"$set": {"favorites": {"$cond": [
            {"$in": [item_id, "$favorites"]},
            {"$setDifference": ["$favorites", [item_id]]},
            {"$concatArrays": ["$favorites", [item_id]]}
        ]}}}],
        upsert=True
    )
    user = users_collection.find_one({"_id": "default"})
    return {"favorites": user.get("favorites", [])}


@router.post("/user/basket/{item_id}")
def toggle_basket(item_id: str):
    users_collection.update_one(
        {"_id": "default"},
        [{"$set": {"basket": {"$cond": [
            {"$in": [item_id, "$basket"]},
            {"$setDifference": ["$basket", [item_id]]},
            {"$concatArrays": ["$basket", [item_id]]}
        ]}}}],
        upsert=True
    )
    user = users_collection.find_one({"_id": "default"})
    return {"basket": user.get("basket", [])}


@router.get("/user/favorites")
def get_favorites():
    user = users_collection.find_one({"_id": "default"})
    return {"favorites": user.get("favorites", [])} if user else {"favorites": []}


@router.get("/user/basket")
def get_basket():
    user = users_collection.find_one({"_id": "default"})
    return {"basket": user.get("basket", [])} if user else {"basket": []}
