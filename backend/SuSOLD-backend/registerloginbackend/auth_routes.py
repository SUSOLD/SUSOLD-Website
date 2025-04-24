from fastapi import APIRouter, HTTPException, status
from user_model import UserRegisterModel, UserLoginModel
from jwt_handler import create_access_token
from bson import ObjectId
from UserProfile_backend.model import creditCard
from database import users_collection


router = APIRouter()


# ✅ REGISTER
@router.post("/register")
async def register(user: UserRegisterModel):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email zaten kayıtlı.")

    hashed_pw = hash_password(user.password)
    
    user_data = {
        "name": user.name,
        "lastname" : user.lastname,
        "email": user.email,
        "addresses": user.addresses,
        "password": hashed_pw,
        "photo" : user.photo,
        "credit_cards" : user.creditCards,
        "isManager" : user.isManager

    }

    result = await users_collection.insert_one(user_data)

    return {"message": "Kayıt başarılı", "user_id": str(result.inserted_id)}

# ✅ LOGIN
@router.post("/login")
async def login(user: UserLoginModel):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Email veya şifre yanlış.")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Email veya şifre yanlış.")

    token = create_access_token({"sub": str(db_user["user_id"]), "email": db_user["email"]})
    return {"access_token": token, "token_type": "bearer"}
