from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["cs308"]

users_collection = db.users
feedback_collection = db.feedbacks
order_collection = db.orders # order yapmistik
cart_collection = db.shopping_cart # cart 
item_collection = db.items
