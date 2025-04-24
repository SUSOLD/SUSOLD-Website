
from pydantic import BaseModel, EmailStr


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


