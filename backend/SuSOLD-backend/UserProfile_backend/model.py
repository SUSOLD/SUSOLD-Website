from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import List, Optional
import re

# DUMMY DUMMY DUMMYYYYYYY
class creditCard(BaseModel):
    number: str
    expiry: str

class Product(BaseModel):
    name: str
    price: float

class Purchase(BaseModel):
    product: Product
    purchase_date: datetime
    purchase_card: creditCard

# -----------------------------------------------

class Feedback(BaseModel):
    rating: Optional[float] = None  # Between 0-5
    comment: Optional[str] = None
    sender: str  # customer
    receiver: str  # seller
    date: datetime

    @field_validator('rating')
    @classmethod
    def check_rating_range(cls, v):
        if v is not None and not (0 <= v <= 5):
            raise ValueError("Rating must be between 0 and 5.")
        return v

    @field_validator('comment')
    @classmethod
    def clean_comment(cls, v):
        if v is not None and v.strip() == "":
            raise ValueError("Comment cannot be an empty string.")
        return v

    @field_validator('comment', mode='before')
    @classmethod
    def at_least_one_feedback(cls, v, values):
        rating = values.get("rating")
        if v is None and rating is None:
            raise ValueError("At least one of rating or comment must be provided.")
        return v


class FeedbackInput(BaseModel):
    rating: Optional[float] = None
    comment: Optional[str] = None
    seller_id: str
    
# -----------------------------------------------

class User(BaseModel):
    name: str        #input
    lastname: str    #input
    email: str       #input
    password: str    #input

    is_Verified: bool = False
    photo: List[str] = []
    creditCards: List[creditCard] = [] # ASK AHMET HOW TO MANAGE

    rating: float = 0.0
    rate_Number: int = 0
    feedbacks_received: List[Feedback] = []

    favorites: List[Product] = [] # ASK ARDA HOW TO MANAGE!!!
    offered_products: List[Product] = []
    purchased_products: List[Purchase] = []

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
    
# -----------------------------------------------

class UserUpdate(BaseModel):
    name: Optional[str]
    lastname: Optional[str]
    email: Optional[str]
    password: Optional[str]
    photo: Optional[List[str]] = None
    creditCards: Optional[List[creditCard]] = []


    @field_validator('email')
    @classmethod
    def validate_sabanci_email(cls, v):
        if v is not None and not v.endswith("@sabanciuniv.edu"):
            raise ValueError("Email must be a valid sabanciuniv.edu address.")
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if v is not None:
            if (len(v) < 6 or
                not re.search(r'\d', v) or
                not re.search(r'[A-Z]', v) or
                not re.search(r'[a-z]', v)):
                raise ValueError("Password must be at least 6 characters and include 1 digit, 1 uppercase, and 1 lowercase letter.")
        return v
    
# -----------------------------------------------
    
class UserLogin(BaseModel):
    email: str
    password: str