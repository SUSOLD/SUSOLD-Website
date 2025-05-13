from datetime import datetime
from pydantic import BaseModel, field_validator, Field
from typing import List, Optional, Annotated
import re

class creditCard(BaseModel):
    number: str
    expiry: str
    name: str
# -----------------------------------------------

class Feedback(BaseModel):
    item: str # corresponding item id
    rating: Optional[float] = None
    comment: Optional[str] = None
    isCommentVerified: bool = False # should be verified by product manager
    sending: str  # customer
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
    item: str
    
# -----------------------------------------------

class User(BaseModel):
    name: str                               #input
    lastname: str                           #input
    email: str                              #input
    password: str                           #input
    photo: List[str] = []                   #input
    credit_cards: List[creditCard] = []     #input
    addresses: List[str] = []               #input
    isManager: bool = False                 #input
    isSalesManager: bool = False            #input

    isVerified: bool = False
    user_id: str                          # we will generate this!!!

    rating: float = 0.0
    rate_number: int = 0
    feedbackReceived: List[Feedback] = []

    favorites: List[str] = []               # item ids will be here
    offeredProducts: List[str] = []         # item ids will be here

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
    addresses: Optional[List[str]] = []


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

# -----------------------------------------------

class RefundRequest(BaseModel):
    user_id: str
    item_ids: List[str]
    order_id: str
    total_price: float
    refund_amount: float  # can be same as total_price or different based on discount
    status: str = "pending"  # "pending", "approved", "rejected"
