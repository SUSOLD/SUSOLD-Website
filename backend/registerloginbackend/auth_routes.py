from fastapi import APIRouter, HTTPException, Depends
from backend.database import users_collection
from fastapi.security import OAuth2PasswordRequestForm
from backend.registerloginbackend.jwt_handler import get_password_hash , verify_password, create_access_token, get_current_user, authenticate_user
from pydantic import EmailStr
from datetime import timedelta
from typing import List
import random

from backend.registerloginbackend.user_model import UserRegisterModel, UserLoginModel

auth_router = APIRouter()

async def generate_unique_user_id():
    while True:
        user_id = "user" + str(random.randint(10000, 99999))
        existing_user = await users_collection.find_one({"user_id": user_id})
        if not existing_user:
            return user_id
        
async def generate_tax_id():
    while True:
        tax_id = str(random.randint(10000000000, 99999999999))
        existing_user = await users_collection.find_one({"tax_id": tax_id})
        if not existing_user:
            return tax_id


@auth_router.post("/register")
async def register(user: UserRegisterModel):
    user_email = user.email.lower()  # normalize email

    if await users_collection.find_one({"email": user_email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Start with the data from UserRegisterModel
    user_data = user.model_dump()
    user_data["email"] = user_email
    user_data["password"] = get_password_hash(user.password)
    
    # Generate a unique user ID
    user_data["user_id"] = await generate_unique_user_id()

    user_data["tax_id"] = await generate_tax_id()
    
    # Add all the default values that are in the User model but not in UserRegisterModel
    user_data["isVerified"] = False
    user_data["rating"] = 0.0
    user_data["rate_number"] = 0
    user_data["feedbackReceived"] = []
    user_data["favorites"] = []
    user_data["offeredProducts"] = []

    await users_collection.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "user_id": user_data["user_id"],
        "email": user_data["email"]
    }



@auth_router.post("/token")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    # Note: form_data.username is actually expected to be an email address
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user["email"]})  # Changed to use email as subject instead of ID
    return {"access_token": access_token, "token_type": "bearer"}