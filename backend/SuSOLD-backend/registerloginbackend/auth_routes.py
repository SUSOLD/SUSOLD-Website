from fastapi import APIRouter, HTTPException, status
from models.user_model import UserRegisterModel, UserLoginModel
from auth.jwt_handler import create_access_token
from database import user_collection
from passlib.context import CryptContext
from bson import ObjectId

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🔐 Şifreyi hashle
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# 🔐 Şifre doğru mu kontrol et
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ✅ REGISTER
@router.post("/register")
async def register(user: UserRegisterModel):
    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email zaten kayıtlı.")

    hashed_pw = hash_password(user.password)
    
    user_data = {
        "name": user.name,
        "email": user.email,
        "address": user.address,
        "password": hashed_pw
    }

    result = await user_collection.insert_one(user_data)

    return {"message": "Kayıt başarılı", "user_id": str(result.inserted_id)}

# ✅ LOGIN
@router.post("/login")
async def login(user: UserLoginModel):
    db_user = await user_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Email veya şifre yanlış.")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Email veya şifre yanlış.")

    token = create_access_token({"sub": str(db_user["_id"]), "email": db_user["email"]})
    return {"access_token": token, "token_type": "bearer"}
