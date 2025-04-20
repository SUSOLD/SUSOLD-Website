from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timezone
from database import user_collection, feedback_collection, product_collection
from auth import get_current_user, hash_password
from model import FeedbackInput, Product, UserUpdate

main_router = APIRouter()

# -------------------------------
# Send a feedback to a specific seller
# -------------------------------
@main_router.post("/send_feedback")
async def send_feedback(data: FeedbackInput, current_user: dict = Depends(get_current_user)):
    try:
        seller_object_id = ObjectId(data.seller_id)
        sender_object_id = current_user["_id"]  # Extracted from the token
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format.")

    if data.rating is None and (data.comment is None or data.comment.strip() == ""):
        raise HTTPException(status_code=400, detail="At least one of rating or comment must be provided.")

    seller = await user_collection.find_one({"_id": seller_object_id})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found.")
    
    # Prepare feedback document
    now = datetime.now(timezone.utc)
    feedback_doc = {
        "rating": data.rating,
        "comment": data.comment,
        "sender": str(sender_object_id),
        "receiver": str(seller_object_id),
        "date": now
    }

    # Insert feedback to feedbacks collection
    await feedback_collection.insert_one(feedback_doc)

    # Update seller rating info if rating was given
    update_data = {"$push": {"feedbacks_received": feedback_doc}} # I changed the variable here !!! be careful 
    if data.rating is not None:
        current_rating = seller.get("rating", 0.0)
        current_rate_number = seller.get("rate_Number", 0)
        new_rate_number = current_rate_number + 1
        new_rating = (current_rating * current_rate_number + data.rating) / new_rate_number
        update_data["$set"] = {
            "rating": new_rating,
            "rate_Number": new_rate_number
        }

    await user_collection.update_one({"_id": seller_object_id}, update_data)

    return {
        "message": "Feedback submitted successfully.",
        "new_rating": round(update_data.get("$set", {}).get("rating", seller["rating"]), 2),
        "rate_Number": update_data.get("$set", {}).get("rate_Number", seller["rate_Number"])
    }


# -------------------------------
# Show feedbacks for current user
# -------------------------------
def serialize_feedback(feedback):
    feedback["_id"] = str(feedback["_id"])
    return feedback

@main_router.get("/my_feedbacks")
async def get_my_feedbacks(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    feedbacks = user.get("feedbacks_received", [])
    serialized_feedbacks = [serialize_feedback(fb) for fb in feedbacks]

    return {"feedbacks_received": serialized_feedbacks}


# -------------------------------
# Return name and lastname of current user
# -------------------------------
@main_router.get("/my_name")
async def get_my_name(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"name": user.get("name"), "lastname": user.get("lastname")}


# -------------------------------
# Show photo of the user
# -------------------------------
@main_router.get("/current_photo")
async def get_current_photo(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    photo_url = user.get("photo", [])
    return {"photo_url": photo_url}


# -------------------------------
# Show current rating the user
# -------------------------------
@main_router.get("/current_rating")
async def get_current_rating(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"current_rating": user.get("rating", 0.0)}


# -------------------------------
# Display is_Verified value of the user
# -------------------------------
@main_router.get("/is_verified")
async def is_user_verified(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_verified = user.get("is_Verified", False)
    return {"is_verified": is_verified}


# -------------------------------
# Diplay offerred products
# -------------------------------
@main_router.get("/my_offerings")
async def get_my_offerings(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"offerings": user.get("offered_products", [])}


# -------------------------------
# Add a product to the offerings of the user
# -------------------------------
@main_router.post("/add_to_offerings")
async def add_to_offerings(product: Product, current_user: dict = Depends(get_current_user)):
    # Step 1: Create product in DB
    product_dict = product.model_dump()
    insert_result = await product_collection.insert_one(product_dict)
    product_id = insert_result.inserted_id

    # Step 2: Fetch full product (including MongoDB _id)
    new_product = await product_collection.find_one({"_id": product_id})
    if not new_product:
        raise HTTPException(status_code=500, detail="Failed to create product.")

    # Step 3: Add product to user's offerings
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "offered_products" not in user:
        user["offered_products"] = []

    user["offered_products"].append(new_product)
    await user_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"offered_products": user["offered_products"]}}
    )

    return {"message": "Product created and added to offerings."}


# -------------------------------
# Remove a product from the offerings of the user
# -------------------------------
@main_router.post("/remove_from_offerings")
async def remove_from_offerings(product_id: str, current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_offerings = [p for p in user.get("offered_products", []) if str(p["_id"]) != product_id]
    if len(updated_offerings) == len(user.get("offered_products", [])):
        raise HTTPException(status_code=400, detail="Product not found in offerings")

    await user_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"offered_products": updated_offerings}}
    )
    return {"message": "Product removed from offerings"}


# -------------------------------
# Show favorite products
# -------------------------------
@main_router.get("/my_favorites")
async def get_my_favorites(current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"favorites": user.get("favorites", [])}


# -------------------------------
# Add a product to favorites
# -------------------------------
@main_router.post("/add_to_favorites")
async def add_to_favorites(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await product_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "favorites" not in user:
        user["favorites"] = []

    if any(str(p["_id"]) == product_id for p in user["favorites"]):
        raise HTTPException(status_code=400, detail="Product already in favorites")

    user["favorites"].append(product)
    await user_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"favorites": user["favorites"]}}
    )

    return {"message": "Product added to favorites"}


# -------------------------------
# Remove a product from favorites
# -------------------------------
@main_router.post("/remove_from_favorites")
async def remove_from_favorites(product_id: str, current_user: dict = Depends(get_current_user)):
    user = await user_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_favorites = [p for p in user.get("favorites", []) if str(p["_id"]) != product_id]

    if len(updated_favorites) == len(user.get("favorites", [])):
        raise HTTPException(status_code=400, detail="Product not found in favorites")

    await user_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"favorites": updated_favorites}}
    )

    return {"message": "Product removed from favorites"}


# -------------------------------
# Remove a product from favorites
# -------------------------------
@main_router.put("/update_user_info")
async def update_user_info(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["_id"])
    user = await user_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No data provided for update.")

    # Validate updated fields using the validators defined in UserUpdate
    try:
        validated = UserUpdate(**update_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if "password" in update_dict:
        update_dict["password"] = hash_password(update_dict["password"])

    await user_collection.update_one({"_id": user_id}, {"$set": update_dict})

    return {"message": "User information updated successfully"}