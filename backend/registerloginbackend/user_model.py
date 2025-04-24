
from pydantic import BaseModel, EmailStr
from typing import List
from backend.UserProfile_backend.model import creditCard

class UserRegisterModel(BaseModel):
    name: str                               #input
    lastname: str                           #input
    email: str                              #input
    password: str                           #input
    photo: List[str] = []                   #input
    credit_cards: List[creditCard] = []     #input
    addresses: List[str] = []               #input
    isManager: bool = False
class UserLoginModel(BaseModel):
    email: EmailStr
    password: str