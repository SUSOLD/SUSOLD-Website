from bson import ObjectId
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.database import items_collection
from app.schemas import ProductCreate, ProductUpdate
from datetime import datetime, time

router = APIRouter()

# ------------------------- GET: List Products -------------------------
@router.get("/home/")
def get_home_data(
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
    warranty_status: Optional[str] = Query(None),
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
    if warranty_status:
        query["warranty_status"] = warranty_status
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

    cursor = items_collection.find(query)
    if sort_order:
        cursor = cursor.sort(sort_order)

    products = []
    for product in cursor:
        product["item_id"] = product.get("item_id", str(product["_id"]))
        product["_id"] = str(product["_id"])
        products.append(product)

    return {"featured_products": products}

# ------------------------- GET by item_id -------------------------
@router.get("/home/item/{item_id}")
def get_product_by_item_id(item_id: str):
    product = items_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ------------------------- GET by Title -------------------------
@router.get("/home/title/{title}")
def get_product_id_by_title(title: str):
    product = items_collection.find_one({"title": title})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"item_id": product.get("item_id", str(product["_id"]))}

# ------------------------- POST -------------------------
@router.post("/home/")
def add_product(product: ProductCreate):
    product_dict = product.dict()
    if product_dict.get("warranty_expiry"):
        product_dict["warranty_expiry"] = datetime.combine(product_dict["warranty_expiry"], time.min)
    result = items_collection.insert_one(product_dict)
    return {"message": "Product added successfully", "item_id": str(result.inserted_id)}

# ------------------------- PUT -------------------------
@router.put("/home/{item_id}")
def update_product(item_id: str, update_data: ProductUpdate):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if "warranty_expiry" in update_dict and update_dict["warranty_expiry"]:
        update_dict["warranty_expiry"] = datetime.combine(update_dict["warranty_expiry"], time.min)

    result = items_collection.update_one(
        {"item_id": item_id},
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
    result = items_collection.delete_one({"item_id": item_id})
    if result.deleted_count == 1:
        return {"message": "Product deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Product not found")
