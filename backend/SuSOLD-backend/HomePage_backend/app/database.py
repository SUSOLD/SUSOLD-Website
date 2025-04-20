from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["susold"]
products_collection = db["items"]
users_collection = db["users"]


