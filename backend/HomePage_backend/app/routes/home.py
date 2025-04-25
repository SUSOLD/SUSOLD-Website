from bson import ObjectId
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database import item_collection
from HomePage_backend.app.schemas import ProductCreate, ProductUpdate
from datetime import datetime, time

router = APIRouter()

# ------------------------- GET: List Products -------------------------
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


# ------------------------- GET by item_id -------------------------
@router.get("/home/item/{item_id}")
async def get_product_by_item_id(item_id: str):
    product = await item_collection.find_one({"item_id": item_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["_id"] = str(product["_id"])
    return product


# ------------------------- GET by Title -------------------------
@router.get("/home/title/{title}")
async def get_product_id_by_title(title: str):
    product = await item_collection.find_one({"title": title})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"item_id": product.get("item_id", str(product["_id"]))}



# ------------------------- POST -------------------------
@router.post("/home/")
async def add_product(product: ProductCreate):
    product_dict = product.dict()
    product_dict["image"] = str(product_dict["image"])
    if product_dict.get("warranty_expiry"):
        product_dict["warranty_expiry"] = datetime.combine(product_dict["warranty_expiry"], time.min)
    result = await item_collection.insert_one(product_dict)
    return {"message": "Product added successfully", "item_id": str(result.inserted_id)}


# ------------------------- PUT  -------------------------
@router.put("/home/{item_id}")
async def update_product(item_id: str, update_data: ProductUpdate):
    existing_item = await item_collection.find_one({"item_id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Product not found")

    update_fields = {}

    if update_data.title is not None:
        update_fields["title"] = update_data.title
    if update_data.description is not None:
        update_fields["description"] = update_data.description
    if update_data.category is not None:
        update_fields["category"] = update_data.category
    if update_data.sub_category is not None:
        update_fields["sub_category"] = update_data.sub_category
    if update_data.brand is not None:
        update_fields["brand"] = update_data.brand
    if update_data.price is not None:
        update_fields["price"] = update_data.price
    if update_data.condition is not None:
        update_fields["condition"] = update_data.condition
    if update_data.age is not None:
        update_fields["age"] = update_data.age
    if update_data.course is not None:
        update_fields["course"] = update_data.course
    if update_data.dorm is not None:
        update_fields["dorm"] = update_data.dorm
    if update_data.verified is not None:
        update_fields["verified"] = update_data.verified
    if update_data.warranty_status is not None:
        update_fields["warranty_status"] = update_data.warranty_status
    if update_data.inStock is not None:
        update_fields["inStock"] = update_data.inStock
    if update_data.available_now is not None:
        update_fields["available_now"] = update_data.available_now
    if update_data.isSold is not None:
        update_fields["isSold"] = update_data.isSold
    if update_data.returnable is not None:
        update_fields["returnable"] = update_data.returnable
    if update_data.image is not None:
        update_fields["image"] = str(update_data.image)

    update_fields["item_id"] = item_id

    await item_collection.update_one(
        {"item_id": item_id},
        {"$set": update_fields}
    )

    return {"message": "Product updated successfully", "item_id": item_id}



# ------------------------- DELETE -------------------------
@router.delete("/home/{item_id}")
async def delete_product(item_id: str):
    result = await item_collection.delete_one({"item_id": item_id})
    if result.deleted_count == 1:
        return {"message": "Product deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Product not found")
