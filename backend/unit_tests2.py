import pytest
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone
from httpx import AsyncClient
import sys
import os

# Add the project root directory to Python's path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import your app
from backend.main import app

# Get the API prefix
API_PREFIX = "/api"  # Adjust this based on your actual API prefix

sample_user = {
    "user_id": "user123",
    "name": "John",
    "email": "john.doe@sabanciuniv.edu",
    "isVerified": True
}

sample_manager = {
    "user_id": "manager123",
    "name": "Admin",
    "email": "admin@sabanciuniv.edu",
    "isSalesManager": True
}

sample_order = {
    "order_id": "order123",
    "user_id": "user123",
    "item_ids": ["item123"],
    "date": datetime.now(timezone.utc).isoformat()
}

sample_item = {
    "item_id": "item123",
    "price": 99.99,
    "isSold": "delivered",
    "inStock": False
}

@pytest.mark.asyncio
async def test_get_purchased_products():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_user), \
         patch("backend.UserProfile_backend.main_routes.users_collection.find_one", AsyncMock(return_value=sample_user)), \
         patch("backend.UserProfile_backend.main_routes.order_collection.find") as mock_find:

        mock_find.return_value.to_list = AsyncMock(return_value=[sample_order])

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get(f"{API_PREFIX}/purchased-products")
            assert response.status_code == 200
            assert sample_order["item_ids"][0] in response.json()


@pytest.mark.asyncio
async def test_cancel_order():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_user), \
         patch("backend.UserProfile_backend.main_routes.order_collection.find_one", AsyncMock(return_value=sample_order)), \
         patch("backend.UserProfile_backend.main_routes.order_collection.delete_one", AsyncMock()), \
         patch("backend.UserProfile_backend.main_routes.item_collection.find_one", AsyncMock(return_value={"item_id": "item123", "isSold": "processing"})), \
         patch("backend.UserProfile_backend.main_routes.item_collection.update_one", AsyncMock()):

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.post(f"{API_PREFIX}/cancel-order/order123")
            assert response.status_code == 200
            assert "successfully canceled" in response.json()["message"]


@pytest.mark.asyncio
async def test_submit_refund_request():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_user), \
         patch("backend.UserProfile_backend.main_routes.order_collection.find_one", AsyncMock(return_value=sample_order)), \
         patch("backend.UserProfile_backend.main_routes.item_collection.find_one", AsyncMock(return_value=sample_item)), \
         patch("backend.UserProfile_backend.main_routes.refund_collection.insert_one", AsyncMock()):

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.post(f"{API_PREFIX}/refund-request/order123", json={"item_ids": ["item123"]})
            assert response.status_code == 200
            assert "Refund request submitted" in response.json()["message"]


@pytest.mark.asyncio
async def test_view_refund_requests_as_manager():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_manager), \
         patch("backend.UserProfile_backend.main_routes.refund_collection.find") as mock_find:

        mock_find.return_value.to_list = AsyncMock(return_value=[{"order_id": "order123"}])

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get(f"{API_PREFIX}/refund-requests")
            assert response.status_code == 200
            assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_handle_refund_approve():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_manager), \
         patch("backend.UserProfile_backend.main_routes.refund_collection.find_one", AsyncMock(return_value={
             "order_id": "order123", "user_id": "user123", "item_ids": ["item123"], "status": "pending", "refund_amount": 99.99
         })), \
         patch("backend.UserProfile_backend.main_routes.refund_collection.update_one", AsyncMock()), \
         patch("backend.UserProfile_backend.main_routes.item_collection.update_one", AsyncMock()), \
         patch("backend.UserProfile_backend.main_routes.users_collection.find_one", AsyncMock(return_value=sample_user)), \
         patch("backend.UserProfile_backend.main_routes.send_email_notification", AsyncMock()):

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.post(f"{API_PREFIX}/handle-refund-request/order123?action=approve")
            assert response.status_code == 200
            assert "Refund approved" in response.json()["message"]


@pytest.mark.asyncio
async def test_handle_refund_reject():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_manager), \
         patch("backend.UserProfile_backend.main_routes.refund_collection.find_one", AsyncMock(return_value={
             "order_id": "order123", "user_id": "user123", "item_ids": ["item123"], "status": "pending", "refund_amount": 99.99
         })), \
         patch("backend.UserProfile_backend.main_routes.refund_collection.update_one", AsyncMock()), \
         patch("backend.UserProfile_backend.main_routes.users_collection.find_one", AsyncMock(return_value=sample_user)), \
         patch("backend.UserProfile_backend.main_routes.send_email_notification", AsyncMock()):

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.post(f"{API_PREFIX}/handle-refund-request/order123?action=reject")
            assert response.status_code == 200
            assert "Refund rejected" in response.json()["message"]


@pytest.mark.asyncio
async def test_set_price():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_manager), \
         patch("backend.UserProfile_backend.main_routes.users_collection.find_one", AsyncMock(return_value=sample_manager)), \
         patch("backend.UserProfile_backend.main_routes.item_collection.find_one", AsyncMock(return_value={"item_id": "item123"})), \
         patch("backend.UserProfile_backend.main_routes.item_collection.update_one", AsyncMock()):

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.post(f"{API_PREFIX}/set-price/item123?price=120.0")
            assert response.status_code == 200
            assert "successfully" in response.json()["message"]


@pytest.mark.asyncio
async def test_get_items_without_price():
    with patch("backend.UserProfile_backend.main_routes.get_current_user", return_value=sample_manager), \
         patch("backend.UserProfile_backend.main_routes.users_collection.find_one", AsyncMock(return_value=sample_manager)), \
         patch("backend.UserProfile_backend.main_routes.item_collection.find") as mock_find:

        mock_find.return_value.to_list = AsyncMock(return_value=[{"item_id": "item123", "price": None}])

        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get(f"{API_PREFIX}/items-without-price")
            assert response.status_code == 200
            assert "items_with_no_price" in response.json()
            assert "item123" in response.json()["items_with_no_price"]
