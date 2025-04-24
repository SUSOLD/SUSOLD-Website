from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client["cs308"]

users_collection = db.users
feedback_collection = db.feedbacks
order_collection = db.orders # order yapmistik
cart_collection = db.shopping_cart # cart 
item_collection = db.items
