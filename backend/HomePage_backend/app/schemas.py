from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Annotated
from datetime import date

ItemID = Annotated[str, Field(pattern=r'^item\d{5}$')]
ShortDescription = Annotated[str, Field(max_length=200)]

class ProductCreate(BaseModel):
    title: str
    description: ShortDescription
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
    inStock: Optional[bool] = None
    available_now: Optional[bool] = None
    isSold: Optional[bool] = None
    returnable: Optional[bool] = None
    image: Optional[str] = None
    item_id: ItemID


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
    isSold: Optional[bool] = None
    returnable: Optional[bool] = None
    image: Optional[str] = None
