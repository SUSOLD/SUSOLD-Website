import os
import sys
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.main import app
from backend.registerloginbackend.jwt_handler import get_current_user

fake_current_user = {
    "user_id": "user123",
    "email": "tasko@sabanciuniv.edu",
    "basket": ["item123"]
}

sample_item = {
    "item_id": "item123",
    "title": "Sample Item",
    "price": 100,
    "inStock": True,
    "isSold": "stillInStock",
    "_id": "some_mongo_id"
}

async def override_get_current_user():
    return fake_current_user

@pytest.fixture
def client():
    app.dependency_overrides = {}
    app.dependency_overrides[get_current_user] = override_get_current_user
    return TestClient(app)

# ----------------- Tests -----------------

@pytest.mark.asyncio
async def test_get_basket(client):
    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_find_user, \
         patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_item:

        mock_find_user.return_value = fake_current_user
        mock_find_item.return_value = sample_item

        response = client.get("/api/basket")
        assert response.status_code == 200
        assert len(response.json()["basket"]) == 1
        assert response.json()["basket"][0]["item_id"] == "item123"

@pytest.mark.asyncio
async def test_add_to_basket(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_item, \
         patch("backend.database.users_collection.update_one", new_callable=AsyncMock) as mock_update_user:

        mock_find_item.return_value = sample_item

        response = client.post("/api/basket/item123")
        assert response.status_code == 200
        assert response.json()["message"] == "Item added to basket"

@pytest.mark.asyncio
async def test_remove_from_basket(client):
    with patch("backend.database.users_collection.update_one", new_callable=AsyncMock):

        response = client.delete("/api/basket/item123")
        assert response.status_code == 200
        assert response.json()["message"] == "Item removed from basket"

@pytest.mark.asyncio
async def test_get_in_stock(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_item:

        mock_find_item.return_value = sample_item

        response = client.get("/api/get_in_stock?item_id=item123")
        assert response.status_code == 200
        assert response.json() is True  # Sample item is in stock

@pytest.mark.asyncio
async def test_get_is_delivered(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_item:

        mock_find_item.return_value = sample_item

        response = client.get("/api/is_delivered?item_id=item123")
        assert response.status_code == 200
        assert response.json() is False  # Sample item is "stillInStock", not "delivered"
