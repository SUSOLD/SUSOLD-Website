from pydantic import BaseModel, Field
from typing import Optional, Annotated
from enum import Enum 
from datetime import datetime

ItemID = Annotated[str, Field(pattern=r'^item\d{5}$')]
ShortDescription = Annotated[str, Field(max_length=200)]

class IsSoldStatus(str, Enum):  
    stillInStock = "stillInStock"
    processing = "processing"
    inTransit = "inTransit"
    delivered = "delivered"

class ProductCreate(BaseModel):
    title: str
    category: str
    sub_category: Optional[str] = None
    brand: str
    price: float
    condition: str
    age: int
    course: Optional[str] = None
    dorm: Optional[bool] = None
    verified: Optional[bool] = None
    warranty_status: Optional[str] = None
    inStock: Optional[bool] = True
    available_now: Optional[bool] = None
    isSold: Optional[IsSoldStatus] = IsSoldStatus.stillInStock  
    returnable: Optional[bool] = None
    description: ShortDescription
    image: Optional[str] = None
    item_id: ItemID
    user_id: Optional[str] = None
    discount_rate: Optional[float] = 0.0
    discounted_price: Optional[float] = None
    cost: Optional[float] = None

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[ShortDescription] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[str] = None
    age: Optional[int] = None
    course: Optional[str] = None
    dorm: Optional[bool] = None
    verified: Optional[bool] = None
    warranty_status: Optional[str] = None
    inStock: Optional[bool] = None
    available_now: Optional[bool] = None
    isSold: Optional[IsSoldStatus] = None  
    returnable: Optional[bool] = None
    image: Optional[str] = None
    discount_rate: Optional[float] = None
    discounted_price: Optional[float] = None
    cost: Optional[float] = None


class CategoryModel(BaseModel):
    name: str = Field(..., min_length=2, max_length=30)
