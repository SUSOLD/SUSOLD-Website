import os
import sys
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from bson import ObjectId

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.main import app
from backend.registerloginbackend.jwt_handler import get_current_user

# Fake user for authentication
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
            "description": "Short description",
            "image": "http://example.com/image.jpg",
            "item_id": "item12345",
            "user_id": "user12345"
        }

        response = client.post("/api/home/", json=product_payload, headers={"Authorization": "Bearer faketoken"})
        assert response.status_code == 200
        assert "item_id" in response.json()
