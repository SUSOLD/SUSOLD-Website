
from pydantic import BaseModel, EmailStr

class UserRegisterModel(BaseModel):
    name: str
    email: EmailStr
    address: str
    password: str

class UserLoginModel(BaseModel):
    email: EmailStr
    password: str


