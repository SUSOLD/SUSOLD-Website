import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from main import app  
from UserProfile_backend.model import FeedbackInput, UserUpdate  
from registerloginbackend.jwt_handler import get_current_user


client = TestClient(app)

# Sample test data
sample_user = {
    "user_id": "user123",
    "name": "John",
    "lastname": "Doe",
    "email": "john.doe@sabanciuniv.edu",
    "isVerified": True,
    "photo": ["photo_url_1"],
    "rating": 4.5,
    "rate_number": 10,
    "feedbackReceived": [],
    "favorites": [],
    "offeredProducts": [],
    "isManager": False
}

sample_manager = {
    "user_id": "manager123",
    "name": "Admin",
    "lastname": "User",
    "email": "admin@sabanciuniv.edu",
    "isVerified": True,
    "isManager": True
}

sample_product = {
    "item_id": "item123",
    "name": "Test Product",
    "price": 99.99
}

sample_feedback = {
    "_id": "dddddddddddddddddddddddd",
    "rating": 4.5,
    "comment": "Great experience!",
    "isCommentVerified": False,
    "sender_id": "user123",
    "receiver_id": "seller123",
    "item": "item123",
    "date": datetime.now(timezone.utc)
}



sample_sales_manager = {
    "user_id": "sales123",
    "name": "Sales",
    "lastname": "Manager",
    "email": "sales.manager@sabanciuniv.edu",
    "isVerified": True,
    "isManager": False,
    "isSalesManager": True,
    "favorites": ["item123"],
    "offeredProducts": []
}

sample_item = {
    "item_id": "item123",
    "title": "Discounted Product",
    "category": "Electronics",
    "price": 100.0,
    "discount_rate": 0.2,
    "discounted_price": 80.0,
    "isSold": "stillInStock",
    "inStock": True,
    "user_id": "user123"
}

sample_customer = {
    "user_id": "user456",
    "email": "sample@sabanciuniv.edu",
    "credit_cards": ["Visa ****1234", "Mastercard ****5678"],
    "addresses": ["Sabancı Dorm A", "Home Address"],
    "basket": ["item123", "item456"]
}

# ----------------------- Core Test 16: Get product by item_id -----------------------
@pytest.mark.asyncio
async def test_get_product_by_item_id():
    with patch("HomePage_backend.app.routes.home.item_collection.find_one", new_callable=AsyncMock) as mock_find_one:
        mock_find_one.return_value = {
            "_id": "mocked_id",
            "item_id": "item123",
            "title": "Test Product",
            "price": 100,
            "inStock": True
        }

        response = client.get("/api/home/item/item123")
        assert response.status_code == 200
        assert response.json()["item_id"] == "item123"
        assert response.json()["title"] == "Test Product"

# ----------------------- Core Test 17: Delete product as manager -----------------------
@pytest.mark.asyncio
async def test_delete_product_as_manager():
    app.dependency_overrides[get_current_user] = lambda: sample_manager

    with patch("HomePage_backend.app.routes.home.item_collection.find_one", new_callable=AsyncMock) as mock_find_one, \
         patch("HomePage_backend.app.routes.home.item_collection.delete_one", new_callable=AsyncMock) as mock_delete_one, \
         patch("HomePage_backend.app.routes.home.users_collection.update_many", new_callable=AsyncMock) as mock_update_many:

        mock_find_one.return_value = {"item_id": "item123", "user_id": "seller1"}
        mock_delete_one.return_value = MagicMock()
        mock_update_many.return_value = MagicMock()

        response = client.delete("/api/home/item123")
        assert response.status_code == 200
        assert "Product deleted" in response.json()["message"]

    # Clean up
    app.dependency_overrides = {}

# ----------------------- Core Test 18: Mark item out of stock -----------------------
@pytest.mark.asyncio
async def test_mark_product_out_of_stock():
    app.dependency_overrides[get_current_user] = lambda: sample_manager

    with patch("UserProfile_backend.main_routes.users_collection.find_one", new_callable=AsyncMock) as mock_user_find_one, \
         patch("UserProfile_backend.main_routes.item_collection.find_one", new_callable=AsyncMock) as mock_item_find_one, \
         patch("UserProfile_backend.main_routes.item_collection.update_one", new_callable=AsyncMock) as mock_item_update, \
         patch("UserProfile_backend.main_routes.users_collection.find", new_callable=MagicMock) as mock_users_find, \
         patch("UserProfile_backend.main_routes.users_collection.update_one", new_callable=AsyncMock) as mock_user_update:

        mock_user_find_one.return_value = sample_manager
        mock_item_find_one.return_value = {
            "item_id": "item123", "inStock": True, "user_id": "seller1"
        }
        mock_users_find.return_value.__aiter__.return_value = [
            {"user_id": "u1", "basket": ["item123"]}
        ]

        response = client.patch("/api/change-stock-status?item_id=item123&in_stock=false")
        assert response.status_code == 200
        assert "out of stock" in response.json()["message"]

    # Clean up
    app.dependency_overrides = {}

# ----------------------- Core Test 19: Setting price as sales manager-----------------------
@pytest.mark.asyncio
async def test_set_price_as_sales_manager():
    app.dependency_overrides[get_current_user] = lambda: sample_sales_manager

    with patch("UserProfile_backend.main_routes.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("UserProfile_backend.main_routes.item_collection.find_one", new_callable=AsyncMock) as mock_item_find, \
         patch("UserProfile_backend.main_routes.item_collection.update_one", new_callable=AsyncMock) as mock_item_update:

        mock_user_find.return_value = sample_sales_manager
        mock_item_find.return_value = {"item_id": "itemD", "price": 0}
        mock_item_update.return_value = MagicMock()

        response = client.post("/api/set-price/itemD?price=150")
        assert response.status_code == 200
        assert "Price for product itemD set to 150" in response.json()["message"]

    app.dependency_overrides = {}


# ----------------------- Core Test 20: Getting invoices as sales manager -----------------------
@pytest.mark.asyncio
async def test_get_invoices_by_date_sales_manager():
    app.dependency_overrides[get_current_user] = lambda: sample_sales_manager

    with patch("HomePage_backend.app.routes.home.order_collection.find", new_callable=MagicMock) as mock_order_find:
        mock_order_find.return_value.to_list = AsyncMock(return_value=[
            {
                "order_id": "order001",
                "user_id": "user123",
                "date": "2024-05-01T10:00:00Z",
                "total_price": 200,
                "number_of_items": 2
            }
        ])

        response = client.get("/api/home/invoices?start_date=2024-05-01&end_date=2024-05-30")
        assert response.status_code == 200
        data = response.json()
        assert "invoices" in data
        assert data["invoices"][0]["order_id"] == "order001"

    app.dependency_overrides = {}


# ----------------------- Core Test 21: Apply discount as sales manager -----------------------
@pytest.mark.asyncio
async def test_apply_discount_as_sales_manager():
    app.dependency_overrides[get_current_user] = lambda: sample_sales_manager

    with patch("HomePage_backend.app.routes.home.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("HomePage_backend.app.routes.home.item_collection.find_one", new_callable=AsyncMock) as mock_item_find, \
         patch("HomePage_backend.app.routes.home.item_collection.update_one", new_callable=AsyncMock) as mock_item_update, \
         patch("HomePage_backend.app.routes.home.users_collection.find", new_callable=MagicMock) as mock_user_cursor, \
         patch("HomePage_backend.app.routes.home.send_discount_email", new_callable=AsyncMock) as mock_send_email:

        mock_user_find.return_value = sample_sales_manager
        mock_item_find.return_value = {"item_id": "item456", "title": "Camera", "price": 100}
        mock_item_update.return_value = MagicMock()
        mock_user_cursor.return_value.__aiter__.return_value = [{"email": "john@sabanciuniv.edu"}]

        response = client.post("/api/home/set-discount/item456?discount_rate=0.2")
        assert response.status_code == 200
        assert "Discount applied" in response.json()["message"]

    app.dependency_overrides = {}


# ----------------------- Core Test 22: Getting invoices as sales manager -----------------------
@pytest.mark.asyncio
async def test_get_items_without_price_as_sales_manager():
    app.dependency_overrides[get_current_user] = lambda: sample_sales_manager

    with patch("UserProfile_backend.main_routes.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("UserProfile_backend.main_routes.item_collection.find", new_callable=MagicMock) as mock_item_find:

        mock_user_find.return_value = sample_sales_manager
        mock_item_find.return_value.to_list = AsyncMock(return_value=[
            {"item_id": "itemX", "title": "Mouse", "price": 0, "category": "Electronics", "condition": "New"}
        ])

        response = client.get("/api/items-without-price")
        assert response.status_code == 200
        assert "items_with_no_price" in response.json()
        assert response.json()["items_with_no_price"][0]["item_id"] == "itemX"

    app.dependency_overrides = {}

# ----------------------- Core Test 23: Getting sales summary as sales manager -----------------------
@pytest.mark.asyncio
async def test_get_sales_summary():
    app.dependency_overrides[get_current_user] = lambda: sample_sales_manager

    with patch("HomePage_backend.app.routes.home.order_collection.find", new_callable=MagicMock) as mock_order_find, \
         patch("HomePage_backend.app.routes.home.item_collection.find_one", new_callable=AsyncMock) as mock_item_find:

        mock_order_find.return_value.to_list = AsyncMock(return_value=[
            {"item_ids": ["item123"], "total_price": 150}
        ])
        mock_item_find.return_value = {"item_id": "item123", "price": 150, "cost": 70}

        response = client.get("/api/home/sales-summary?start_date=2024-05-01&end_date=2024-05-30")
        assert response.status_code == 200
        data = response.json()
        assert data["total_revenue"] == 150
        assert data["total_cost"] == 70
        assert data["total_profit"] == 80

    app.dependency_overrides = {}


# ----------------------- Core Test 24: Viewing purchased products as customer -----------------------
@pytest.mark.asyncio
async def test_get_purchased_products():
    app.dependency_overrides[get_current_user] = lambda: sample_customer

    with patch("UserProfile_backend.main_routes.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("UserProfile_backend.main_routes.order_collection.find", new_callable=MagicMock) as mock_order_find:

        mock_user_find.return_value = sample_customer
        mock_order_find.return_value.to_list = AsyncMock(return_value=[
            {"item_ids": ["itemA", "itemB"]}
        ])

        response = client.get("/api/purchased-products")
        assert response.status_code == 200
        assert "itemA" in response.json()
        assert "itemB" in response.json()

    app.dependency_overrides = {}


# ----------------------- Core Test 25: Fetching cart items as customer -----------------------
@pytest.mark.asyncio
async def test_fetch_cart_items():
    app.dependency_overrides[get_current_user] = lambda: sample_customer

    with patch("PurchaseScreen_backend.purchase.users_collection.find_one", new_callable=AsyncMock) as mock_user_find_one, \
         patch("PurchaseScreen_backend.purchase.item_collection.find", new_callable=MagicMock) as mock_item_find:

        mock_user_find_one.return_value = sample_customer
        mock_item_find.return_value.to_list = AsyncMock(return_value=[
            {"title": "Secondhand Notebook"},
            {"title": "Mini Fridge"}
        ])

        response = client.get("/api/cart-items")

        assert response.status_code == 200
        assert response.json()["item_names"] == ["Secondhand Notebook", "Mini Fridge"]

    app.dependency_overrides = {}
