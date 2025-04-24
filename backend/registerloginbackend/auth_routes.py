from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from backend.UserProfile_backend.model import User, UserLogin
from backend.registerloginbackend.jwt_handler import authenticate_user, create_access_token, hash_password
from backend.database import users_collection
from datetime import timedelta
import random

auth_router = APIRouter(prefix="/auth", tags=["auth"])

async def generate_unique_user_id(users_collection):
    # Get all existing user_ids as a set for quick lookup
    existing_ids = {
        doc["user_id"]
        async for doc in users_collection.find({}, {"user_id": 1, "_id": 0})
    }

    while True:
        user_id_number = random.randint(0, 99999)
        user_id = f"user{user_id_number:05d}"
        if user_id not in existing_ids:
            return user_id

# USER REGISTERATION
@auth_router.post("/register")
async def register_user(user: User):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    user.password = hash_password(user.password)
    user_dict = user.model_dump()

    user_dict["user_id"] = await generate_unique_user_id(users_collection)

    await users_collection.insert_one(user_dict)
    return {"message": "User registered successfully."}


# USER LOGIN
@auth_router.post("/token")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": str(user["user_id"])}) # USER_ID İLE DEĞİŞTİRDİM!!!!!
    return {"access_token": access_token, "token_type": "bearer"}