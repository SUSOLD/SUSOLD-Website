
from pydantic import BaseModel, EmailStr, field_validator
from typing import List
from backend.UserProfile_backend.model import creditCard
import re

class UserRegisterModel(BaseModel):
    name: str                               #input
    lastname: str                           #input
    email: str                              #input
    password: str                           #input
    photo: List[str] = []                   #input
    credit_cards: List[creditCard] = []     #input
    addresses: List[str] = []               #input
    isManager: bool = False

    @field_validator('email')
    @classmethod
    def validate_sabanci_email(cls, v):
        if not v.endswith("@sabanciuniv.edu"):
            raise ValueError("Email must be a valid sabanciuniv.edu address.")
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if (len(v) < 6 or
            not re.search(r'\d', v) or
            not re.search(r'[A-Z]', v) or
            not re.search(r'[a-z]', v)):
            raise ValueError("Password must be at least 6 characters and include 1 digit, 1 uppercase, and 1 lowercase letter.")
        return v
    
class UserLoginModel(BaseModel):
    email: EmailStr
    password: str