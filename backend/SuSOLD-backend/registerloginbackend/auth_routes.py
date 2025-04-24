from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from model import User, UserLogin
from auth import authenticate_user, create_access_token, hash_password
from database import users_collection
from datetime import timedelta

auth_router = APIRouter(prefix="/auth", tags=["auth"])

# USER REGISTERATION
@auth_router.post("/register")
async def register_user(user: User):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    user.password = hash_password(user.password)
    user_dict = user.model_dump()
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