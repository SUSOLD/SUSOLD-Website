import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.main import app
from backend.UserProfile_backend.model import FeedbackInput, UserUpdate, Feedback

client = TestClient(app)

# Sample data
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
    "price": 99.99,
    "user_id": "user123"
}

sample_feedback = {
    "_id": ObjectId("dddddddddddddddddddddddd"),
    "rating": 4.5,
    "comment": "Great experience!",
    "isCommentVerified": False,
    "sender_id": "user123",
    "receiver_id": "seller123",
    "item": "item123",
    "date": datetime.now(timezone.utc)
}

# Tests

@pytest.mark.asyncio
async def test_get_unapproved_comments_as_manager():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        feedback_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "manager123"}):
        from backend.database import users_collection, feedback_collection

        users_collection.find_one.return_value = sample_manager
        feedback_collection.find.return_value.to_list.return_value = [sample_feedback]

        response = client.get("/api/unapproved_comments")
        assert response.status_code == 200
        assert len(response.json()["unapproved_comments"]) == 1

@pytest.mark.asyncio
async def test_get_unapproved_comments_as_regular_user():
    with patch("backend.database.users_collection", new=AsyncMock()) as mock_users, \
         patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        mock_users.find_one.return_value = sample_user

        response = client.get("/api/unapproved_comments")
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_send_feedback_success():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        feedback_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        from backend.database import users_collection, feedback_collection

        seller = {**sample_user, "user_id": "seller123", "rating": 4.0, "rate_number": 5}
        users_collection.find_one.return_value = seller

        feedback_data = {
            "rating": 4.5,
            "comment": "Great service!",
            "seller_id": "seller123",
            "item": "item123"
        }

        response = client.post("/api/send_feedback", json=feedback_data)
        assert response.status_code == 200
        assert "Feedback submitted successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_get_my_feedbacks():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        feedback_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        from backend.database import users_collection, feedback_collection

        users_collection.find_one.return_value = sample_user

        async def mock_feedback_gen():
            yield {
                "_id": ObjectId("dddddddddddddddddddddddd"),
                "rating": 4.5,
                "comment": "Great experience!",
                "receiver": "user123",
                "isCommentVerified": True
            }
            yield {
                "_id": ObjectId("eeeeeeeeeeeeeeeeeeeeeeee"),
                "rating": 3.0,
                "comment": None,
                "receiver": "user123",
                "isCommentVerified": False
            }

        feedback_collection.find.return_value.__aiter__.return_value = mock_feedback_gen()

        response = client.get("/api/my_feedbacks")
        assert response.status_code == 200
        assert len(response.json()["feedbacks_received"]) == 2
        assert response.json()["feedbacks_received"][1]["comment"] == "no comment"

@pytest.mark.asyncio
async def test_approve_comment_success_as_manager():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        feedback_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "manager123"}):
        from backend.database import users_collection, feedback_collection

        users_collection.find_one.return_value = sample_manager
        feedback_collection.update_one.return_value = MagicMock(matched_count=1)

        response = client.post("/api/approve_comment/dddddddddddddddddddddddd")
        assert response.status_code == 200
        assert "Comment approved successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_approve_comment_invalid_id():
    with patch("backend.database.users_collection", new=AsyncMock()) as mock_users, \
         patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "manager123"}):
        mock_users.find_one.return_value = sample_manager

        response = client.post("/api/approve_comment/invalid-id")
        assert response.status_code == 400
        assert "Invalid feedback ID format" in response.json()["detail"]

@pytest.mark.asyncio
async def test_remove_comment_success_as_manager():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        feedback_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "manager123"}):
        from backend.database import users_collection, feedback_collection

        users_collection.find_one.return_value = sample_manager
        feedback_collection.update_one.return_value = MagicMock(matched_count=1)

        response = client.delete("/api/remove_comment/dddddddddddddddddddddddd")
        assert response.status_code == 200
        assert "Comment removed successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_get_my_name():
    with patch("backend.database.users_collection", new=AsyncMock()) as mock_users, \
         patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        mock_users.find_one.return_value = sample_user

        response = client.get("/api/my_name")
        assert response.status_code == 200
        assert response.json()["name"] == "John"
        assert response.json()["lastname"] == "Doe"

@pytest.mark.asyncio
async def test_get_current_photo():
    with patch("backend.database.users_collection", new=AsyncMock()) as mock_users, \
         patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        mock_users.find_one.return_value = sample_user

        response = client.get("/api/current_photo")
        assert response.status_code == 200
        assert response.json()["photo_url"] == ["photo_url_1"]

@pytest.mark.asyncio
async def test_get_current_rating():
    with patch("backend.database.users_collection", new=AsyncMock()) as mock_users, \
         patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        mock_users.find_one.return_value = sample_user

        response = client.get("/api/current_rating")
        assert response.status_code == 200
        assert response.json()["current_rating"] == 4.5

@pytest.mark.asyncio
async def test_is_user_verified():
    with patch("backend.database.users_collection", new=AsyncMock()) as mock_users, \
         patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        mock_users.find_one.return_value = sample_user

        response = client.get("/api/is_verified")
        assert response.status_code == 200
        assert response.json()["is_verified"] == True

@pytest.mark.asyncio
async def test_get_my_offerings():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        item_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        from backend.database import users_collection, item_collection

        users_collection.find_one.return_value = sample_user
        item_collection.find.return_value.to_list.return_value = [sample_product]

        response = client.get("/api/my_offerings")
        assert response.status_code == 200
        assert response.json()["offerings"][0]["item_id"] == "item123"

@pytest.mark.asyncio
async def test_add_to_favorites():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        item_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        from backend.database import users_collection, item_collection

        user_data = {**sample_user, "favorites": []}
        users_collection.find_one.return_value = user_data
        item_collection.find_one.return_value = sample_product

        response = client.post("/api/add_to_favorites?product_id=item123")
        assert response.status_code == 200
        assert "Product added to favorites" in response.json()["message"]

@pytest.mark.asyncio
async def test_add_to_favorites_already_added():
    with patch.multiple(
        "backend.database",
        users_collection=AsyncMock(),
        item_collection=AsyncMock()
    ), patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        from backend.database import users_collection, item_collection

        user_data = {**sample_user, "favorites": ["item123"]}
        users_collection.find_one.return_value = user_data
        item_collection.find_one.return_value = sample_product

        response = client.post("/api/add_to_favorites?product_id=item123")
        assert response.status_code == 400
        assert "Product already in favorites" in response.json()["detail"]

@pytest.mark.asyncio
async def test_remove_from_favorites():
    with patch("backend.database.users_collection", new=AsyncMock()) as mock_users, \
         patch("backend.registerloginbackend.jwt_handler.get_current_user", return_value={"user_id": "user123"}):
        mock_users.find_one.return_value = {**sample_user, "favorites": ["item123"]}

        response = client.post("/api/remove_from_favorites?product_id=item123")
        assert response.status_code == 200
        assert "Product removed from favorites" in response.json()["message"]
