import os
import sys
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from bson import ObjectId
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.main import app
from backend.registerloginbackend.jwt_handler import get_current_user

# Fake user to simulate authentication
fake_current_user = {
    "user_id": "user123",
    "email": "tasko@sabanciuniv.edu",
    "name": "ard",
    "lastname": "taskoo",
    "photo": [],
    "credit_cards": [],
    "addresses": [],
    "isManager": False,
    "isVerified": False,
    "rating": 0.0,
    "rate_number": 0,
    "feedbackReceived": [],
    "favorites": [],
    "offeredProducts": []
}

async def override_get_current_user():
    return fake_current_user

@pytest.fixture
def client():
    app.dependency_overrides = {}
    app.dependency_overrides[get_current_user] = override_get_current_user
    return TestClient(app)

sample_product = {
    "item_id": "item123",
    "title": "Sample Item",
    "price": 100,
    "description": "Good item",
    "user_id": "user123"
}

updated_product_data = {
    "price": 150,
    "description": "Updated description"
}

# --- TESTS START ---

@pytest.mark.asyncio
async def test_add_product_success(client):
    with patch("backend.database.item_collection.insert_one", new_callable=AsyncMock) as mock_insert, \
         patch("backend.database.users_collection.update_one", new_callable=AsyncMock):

        mock_insert.return_value.inserted_id = ObjectId()

        product_payload = {
            "title": "New Product",
            "category": "Books",
            "sub_category": "Textbooks",
            "brand": "SomeBrand",
            "price": 250.0,
            "condition": "New",
            "age": 0,
            "course": "History 101",
            "dorm": False,
            "verified": True,
            "warranty_status": "Valid",
            "inStock": True,
            "available_now": True,
            "isSold": "stillInStock",
            "returnable": True,
            "description": "Short description of the book",
            "image": "http://example.com/image.jpg",
            "item_id": "item12345",
            "user_id": "user12345"  
        }

        response = client.post("/api/home/", json=product_payload, headers={"Authorization": "Bearer faketoken"})
        assert response.status_code == 200
        assert "item_id" in response.json()

@pytest.mark.asyncio
async def test_update_product_success(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one, \
         patch("backend.database.item_collection.update_one", new_callable=AsyncMock):

        mock_find_one.return_value = {**sample_product, "user_id": "user123"}

        response = client.put("/api/home/item123", json=updated_product_data)
        assert response.status_code == 200
        assert "Product updated successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_delete_product_success(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one, \
         patch("backend.database.item_collection.delete_one", new_callable=AsyncMock), \
         patch("backend.database.users_collection.update_one", new_callable=AsyncMock):

        mock_find_one.return_value = {**sample_product, "user_id": "user123"}

        response = client.delete("/api/home/item123")
        assert response.status_code == 200
        assert "Product deleted successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_update_product_unauthorized(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one:
        mock_find_one.return_value = {**sample_product, "user_id": "someone_else"}

        response = client.put("/api/home/item123", json=updated_product_data)
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_product_not_found(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one:
        mock_find_one.return_value = None

        response = client.delete("/api/home/item123")
        assert response.status_code == 404
        assert "Product not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_add_product_without_authentication():
    from fastapi import HTTPException

    async def failing_override():
        raise HTTPException(status_code=401, detail="Invalid credentials")

    app.dependency_overrides[get_current_user] = failing_override
    unauthenticated_client = TestClient(app)

    payload = {
        "title": "Unauthorized Product",
        "price": 300,
        "description": "Unauthorized add",
        "image": "http://image.url",
        "category": "Electronics",
        "sub_category": "Laptops",
        "condition": "New",
        "age": 0,
        "course": False,
        "dorm": False,
        "verified": True,
        "inStock": True,
        "available_now": True,
        "returnable": True
    }

    response = unauthenticated_client.post("/api/home/", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] in ["Invalid credentials", "Not authenticated"]
