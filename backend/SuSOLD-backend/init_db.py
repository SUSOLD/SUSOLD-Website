from pymongo import MongoClient
import pprint

print("hello world1")
client = MongoClient("mongodb://localhost:27017/")
db = client["ecommerce"]


db.users.drop()
db.items.drop()
db.cart.drop()
db.bought_items.drop()

print("hello world2")
db.users.insert_one({
    "user_id": 123,
    "credit_cards": ["1111 1111 1111 1111", "2222 2222 2222 2222"],
    "addresses": ["Tuzla", "Pendik"]
})

print("hello world3")

db.items.insert_many([
    {"item_id": 1, "item_name": "Red Blouse"},
    {"item_id": 2, "item_name": "Checkered Shirt"},
    {"item_id": 3, "item_name": "Green Skirt"}
])

db.cart.insert_many([
    {"user_id": 123, "item_id": 1},
    {"user_id": 123, "item_id": 2},
    {"user_id": 123, "item_id": 3}
])

print("Users:")
pprint.pprint(list(db.users.find()))

print("\nItems:")
pprint.pprint(list(db.items.find()))

print("\nCart:")
pprint.pprint(list(db.cart.find()))

