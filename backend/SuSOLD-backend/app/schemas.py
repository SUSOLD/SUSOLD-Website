from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class ProductCreate(BaseModel):
    title: str
    description: str
    category: str
    subcategory: Optional[str] = None
    price: float
    condition: str
    age: str
    warranty_status: bool = False
    warranty_expiry: Optional[date] = None
    address: Optional[str] = None
    dorm: bool = False
    course: Optional[str] = None
    isSold: bool = False
    pickup_method: str
    delivery_cost: Optional[float] = 0.0
    seller_verified: bool = False
    images: List[str] = []


class ProductUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    category: Optional[str]
    subcategory: Optional[str]
    price: Optional[float]
    condition: Optional[str]
    age: Optional[str]
    warranty_status: Optional[bool]
    warranty_expiry: Optional[date]
    address: Optional[str]
    dorm: Optional[bool]
    course: Optional[str]
    isSold: Optional[bool]
    pickup_method: Optional[str]
    delivery_cost: Optional[float]
    seller_verified: Optional[bool]
    images: Optional[List[str]]
