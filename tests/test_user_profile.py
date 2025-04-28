import pytest
import sys
import os
from unittest.mock import patch, MagicMock, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Backend dosyalarını bulabilmek için path ayarlaması
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.main import app
from backend.registerloginbackend.jwt_handler import get_current_user

# Test client fixture
@pytest.fixture
def client():
    app.dependency_overrides = {}
    return TestClient(app)

# Sahte kullanıcılar
sample_user = {
    "_id": ObjectId(),
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
    "_id": ObjectId(),
    "user_id": "manager123",
    "name": "Admin",
    "lastname": "User",
    "email": "admin@sabanciuniv.edu",
    "isVerified": True,
    "isManager": True
}

sample_product = {
    "_id": ObjectId(),
    "item_id": "item123",
    "name": "Test Product",
    "price": 99.99,
    "user_id": "user123"
}


sample_feedback = {
    "_id": ObjectId(),
    "rating": 4.5,
    "comment": "Great experience!",
    "isCommentVerified": False,
    "sender_id": "user123",
    "receiver_id": "seller123",
    "item": "item123",
    "date": datetime.now(timezone.utc)
}

mock_user_auth = {
    "id": str(sample_user["_id"]),
    "email": sample_user["email"],
    "user_id": sample_user["user_id"],
    "credit_cards": [],
    "addresses": []
}

mock_manager_auth = {
    "id": str(sample_manager["_id"]),
    "email": sample_manager["email"],
    "user_id": sample_manager["user_id"],
    "credit_cards": [],
    "addresses": []
}

# Dependency override fonksiyonları
async def override_get_current_user_user():
    return mock_user_auth

async def override_get_current_user_manager():
    return mock_manager_auth

# -------------------------------- TESTLER -------------------------------- #

def test_send_feedback_success(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.feedback_collection.insert_one", new_callable=AsyncMock) as mock_feedback_insert, \
         patch("backend.database.users_collection.update_one", new_callable=AsyncMock) as mock_user_update:

        mock_user_find.return_value = {
            "user_id": "fake_seller_id",
            "rating": 4.0,
            "rate_number": 2
        }

        feedback_data = {
            "seller_id": "fake_seller_id",
            "rating": 5.0,
            "comment": "Awesome seller!",
            "item": "item123"
        }

        response = client.post("/api/send_feedback", json=feedback_data)
        assert response.status_code == 200
        assert response.json()["message"] == "Feedback submitted successfully."


def test_get_unapproved_comments_as_manager(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_manager

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.feedback_collection.find", new_callable=MagicMock) as mock_feedback_find:

        mock_user_find.return_value = sample_manager
        # Fix: Use AsyncMock for to_list
        mock_feedback_find.return_value.to_list = AsyncMock(return_value=[sample_feedback])

        response = client.get("/api/unapproved_comments")
        assert response.status_code == 200
        assert len(response.json()["unapproved_comments"]) == 1


def test_get_unapproved_comments_as_regular_user(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find:
        mock_user_find.return_value = sample_user

        response = client.get("/api/unapproved_comments")
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]


def test_get_my_feedbacks(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.feedback_collection.find", new_callable=MagicMock) as mock_feedback_find:

        mock_user_find.return_value = sample_user
        # Fix: Add _id field to each feedback object
        mock_feedback_find.return_value.__aiter__.return_value = [
            {"_id": ObjectId(), "rating": 4.5, "comment": "Great!", "receiver_id": "user123", "isCommentVerified": True},
            {"_id": ObjectId(), "rating": 3.0, "comment": None, "receiver_id": "user123", "isCommentVerified": False}
        ]

        response = client.get("/api/my_feedbacks")
        assert response.status_code == 200
        assert len(response.json()["feedbacks_received"]) == 2


def test_approve_comment_success_as_manager(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_manager

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.feedback_collection.update_one", new_callable=AsyncMock) as mock_feedback_update:

        mock_user_find.return_value = sample_manager
        mock_feedback_update.return_value = MagicMock(matched_count=1)

        response = client.post("/api/approve_comment/dddddddddddddddddddddddd")
        assert response.status_code == 200


def test_approve_comment_invalid_id(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_manager

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find:
        mock_user_find.return_value = sample_manager

        response = client.post("/api/approve_comment/invalid-id")
        assert response.status_code == 400


def test_remove_comment_success_as_manager(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_manager

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.feedback_collection.update_one", new_callable=AsyncMock) as mock_feedback_update:

        mock_user_find.return_value = sample_manager
        mock_feedback_update.return_value = MagicMock(matched_count=1)

        response = client.delete("/api/remove_comment/dddddddddddddddddddddddd")
        assert response.status_code == 200


def test_get_my_name(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find:
        mock_user_find.return_value = sample_user

        response = client.get("/api/my_name")
        assert response.status_code == 200
        assert response.json()["name"] == "John"
        assert response.json()["lastname"] == "Doe"


def test_get_current_photo(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find:
        mock_user_find.return_value = sample_user

        response = client.get("/api/current_photo")
        assert response.status_code == 200
        assert response.json()["photo_url"] == ["photo_url_1"]


def test_get_current_rating(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find:
        mock_user_find.return_value = sample_user

        response = client.get("/api/current_rating")
        assert response.status_code == 200
        assert response.json()["current_rating"] == 4.5


def test_get_my_offerings(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.item_collection.find", new_callable=MagicMock) as mock_items_find, \
         patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find:

        mock_user_find.return_value = AsyncMock(return_value={**sample_user, "isVerified": True})
        # Fix: Use AsyncMock for to_list
        mock_items_find.return_value.to_list = AsyncMock(return_value=[sample_product])

        response = client.get("/api/my_offerings")
        assert response.status_code == 200
        assert response.json()["offerings"][0]["item_id"] == "item123"


def test_add_to_favorites(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_item_find:

        mock_user_find.return_value = {**sample_user, "favorites": []}
        mock_item_find.return_value = sample_product

        response = client.post("/api/add_to_favorites?product_id=item123")
        assert response.status_code == 200


def test_add_to_favorites_already_added(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.item_collection.find_one", new_callable=AsyncMock) as mock_item_find:

        mock_user_find.return_value = {**sample_user, "favorites": ["item123"]}
        mock_item_find.return_value = sample_product

        response = client.post("/api/add_to_favorites?product_id=item123")
        assert response.status_code == 400


def test_remove_from_favorites(client):
    app.dependency_overrides[get_current_user] = override_get_current_user_user

    with patch("backend.database.users_collection.find_one", new_callable=AsyncMock) as mock_user_find, \
         patch("backend.database.users_collection.update_one", new_callable=AsyncMock) as mock_user_update:
        
        mock_user_find.return_value = {**sample_user, "favorites": ["item123"]}
        # Mock the update operation
        mock_user_update.return_value = AsyncMock(modified_count=1)

        response = client.post("/api/remove_from_favorites?product_id=item123")
        assert response.status_code == 200
