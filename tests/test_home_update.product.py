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
    "email": "tasko@sabanciuniv.edu"
}

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

async def override_get_current_user():
    return fake_current_user

@pytest.fixture
def client():
    app.dependency_overrides = {}
    app.dependency_overrides[get_current_user] = override_get_current_user
    return TestClient(app)

@pytest.mark.asyncio
async def test_update_product_success(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one, \
         patch("backend.database.item_collection.update_one", new_callable=AsyncMock):

        mock_find_one.return_value = {**sample_product, "user_id": "user123"}

        response = client.put("/api/home/item123", json=updated_product_data)
        assert response.status_code == 200
        assert "Product updated successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_update_product_unauthorized(client):
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one:
        mock_find_one.return_value = {**sample_product, "user_id": "someone_else"}

        response = client.put("/api/home/item123", json=updated_product_data)
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]
