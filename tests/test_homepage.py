
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

sample_product = {
    "_id": "64b1d0c8f9d1c39c23456789",
    "item_id": "item12345",
    "title": "Test Product",
    "category": "Books",
    "sub_category": "Novel",
    "brand": "BrandA",
    "price": 29.99,
    "condition": "New",
    "age": 1,
    "course": False,
    "dorm": False,
    "verified": True,
    "inStock": True,
    "available_now": True,
    "isSold": "stillInStock",
    "returnable": True,
    "description": "A great test product.",
    "image": "http://example.com/image.jpg"
}

# --------------------- TESTS ---------------------

@pytest.mark.asyncio
async def test_list_products():
    with patch("database.item_collection.find") as mock_find:
        mock_cursor = AsyncMock()
        mock_cursor.__aiter__.return_value = [sample_product]
        mock_find.return_value = mock_cursor

        response = client.get("/api/home/")
        assert response.status_code == 200
        assert response.json()["featured_products"][0]["item_id"] == sample_product["item_id"]


@pytest.mark.asyncio
async def test_get_product_by_item_id():
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one:
        mock_find_one.return_value = sample_product

        response = client.get("/api/home/item/item12345")
        assert response.status_code == 200
        product = response.json()
        assert product["title"] == "Test Product"
        assert product["item_id"] == "item12345"

@pytest.mark.asyncio
async def test_get_product_by_title():
    with patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_find_one:
        mock_find_one.return_value = sample_product

        response = client.get("/api/home/title/Test Product")
        assert response.status_code == 200
        product = response.json()
        assert product["item_id"] == "item12345"
