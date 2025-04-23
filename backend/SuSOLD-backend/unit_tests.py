# ----------------------------------------- USER PROFILE TESTS -----------------------------------------

import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from main import app  # Assuming your FastAPI app is in main.py
from UserProfile_backend.model import FeedbackInput, UserUpdate  # Adjust imports to your structure

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

# Core test 1: Authorization test
@pytest.mark.asyncio
async def test_get_unapproved_comments_as_manager():
    """Test that managers can access unapproved comments"""
    with patch("user_profile.main_routes.get_current_user", return_value={"user_id": "manager123", "isManager": True}), \
         patch("user_profile.main_routes.users_collection") as mock_users_collection, \
         patch("user_profile.main_routes.feedback_collection") as mock_feedback_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_manager
        mock_feedback_collection.find.return_value.to_list = AsyncMock(return_value=[sample_feedback])
        
        # Create test client
        test_client = TestClient(app)
        
        # Make the request
        response = test_client.get("/unapproved_comments")
        
        # Assertions
        assert response.status_code == 200
        assert "unapproved_comments" in response.json()
        assert len(response.json()["unapproved_comments"]) == 1

@pytest.mark.asyncio
async def test_get_unapproved_comments_as_regular_user():
    """Test that regular users cannot access unapproved comments"""
    with patch("user_profile.main_routes.get_current_user", return_value={"user_id": "user123", "isManager": False}), \
         patch("user_profile.main_routes.users_collection") as mock_users_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_user
        
        # Create test client
        test_client = TestClient(app)
        
        # Make the request
        response = test_client.get("/unapproved_comments")
        
        # Assertions
        assert response.status_code == 403
        assert "Not authorized" in response.json()["detail"]

# Core test 2: Send feedback
@pytest.mark.asyncio
async def test_send_feedback_success():
    """Test submitting feedback for a seller"""
    with patch("user_profile.main_routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("user_profile.main_routes.users_collection") as mock_users_collection, \
         patch("user_profile.main_routes.feedback_collection") as mock_feedback_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_user
        mock_feedback_collection.insert_one = AsyncMock()
        mock_users_collection.update_one = AsyncMock()
        
        # Test data
        feedback_data = {
            "rating": 4.5,
            "comment": "Great service!",
            "seller_id": "seller123",
            "item": "item123"
        }
        
        # Make the request
        response = client.post("/send_feedback", json=feedback_data)
        
        # Assertions
        assert response.status_code == 200
        assert "Feedback submitted successfully" in response.json()["message"]
        mock_feedback_collection.insert_one.assert_called_once()

# Core test 3: Get my feedbacks
@pytest.mark.asyncio
async def test_get_my_feedbacks():
    """Test retrieving user's received feedback"""
    with patch("user_profile.main_routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("user_profile.main_routes.users_collection") as mock_users_collection, \
         patch("user_profile.main_routes.feedback_collection") as mock_feedback_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_user
        mock_feedback_collection.find.return_value = AsyncMock()
        mock_feedback_collection.find.return_value.to_list = AsyncMock(return_value=[sample_feedback])
        
        # Make the request
        response = client.get("/my_feedbacks")
        
        # Assertions
        assert response.status_code == 200
        assert "feedbacks_received" in response.json()
        assert len(response.json()["feedbacks_received"]) == 1

# Core test 4: Approve comment
@pytest.mark.asyncio
async def test_approve_comment_success_as_manager():
    """Test manager approving a feedback comment"""
    with patch("user_profile.main_routes.get_current_user", return_value={"user_id": "manager123", "isManager": True}), \
         patch("user_profile.main_routes.users_collection") as mock_users_collection, \
         patch("user_profile.main_routes.feedback_collection") as mock_feedback_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_manager
        mock_result = MagicMock()
        mock_result.matched_count = 1
        mock_feedback_collection.update_one = AsyncMock(return_value=mock_result)
        
        # Make the request
        response = client.post(f"/approve_comment/{sample_feedback['_id']}")
        
        # Assertions
        assert response.status_code == 200
        assert "Comment approved successfully" in response.json()["message"]

# Core test 5: Add product to offerings
@pytest.mark.asyncio
async def test_add_to_offerings():
    """Test adding a product to user's offerings"""
    with patch("products.routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("products.routes.users_collection") as mock_users_collection, \
         patch("products.routes.item_collection") as mock_item_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_user
        mock_item_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id="item123"))
        mock_item_collection.find_one = AsyncMock(return_value=sample_product)
        mock_users_collection.update_one = AsyncMock()
        
        # Test data
        product_data = {
            "name": "Test Product",
            "price": 99.99
        }
        
        # Make the request
        response = client.post("/add_to_offerings", json=product_data)
        
        # Assertions
        assert response.status_code == 200
        assert "Product created and added to offerings" in response.json()["message"]
        mock_item_collection.insert_one.assert_called_once()

# Core test 6: Get user's offerings
@pytest.mark.asyncio
async def test_get_my_offerings():
    """Test retrieving user's product offerings"""
    with patch("products.routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("products.routes.users_collection") as mock_users_collection:
        
        # Set up mocks
        user_with_products = dict(sample_user)
        user_with_products["offeredProducts"] = ["item123"]
        mock_users_collection.find_one.return_value = user_with_products
        
        # Make the request
        response = client.get("/my_offerings")
        
        # Assertions
        assert response.status_code == 200
        assert "offerings" in response.json()
        assert len(response.json()["offerings"]) == 1
        assert response.json()["offerings"][0] == "item123"

# Core test 7: Update user info
@pytest.mark.asyncio
async def test_update_user_info():
    """Test updating user profile information"""
    with patch("user_profile.main_routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("user_profile.main_routes.users_collection") as mock_users_collection, \
         patch("user_profile.main_routes.hash_password") as mock_hash_password:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_user
        mock_hash_password.return_value = "hashed_password_123"
        mock_users_collection.update_one = AsyncMock()
        
        # Test data
        update_data = {
            "name": "Updated Name",
            "password": "NewPassword123"
        }
        
        # Make the request
        response = client.put("/update_user_info", json=update_data)
        
        # Assertions
        assert response.status_code == 200
        assert "User information updated successfully" in response.json()["message"]
        mock_hash_password.assert_called_once_with("NewPassword123")

# Core test 8: Input validation
@pytest.mark.asyncio
async def test_update_user_info_invalid_email():
    """Test validation of email format in user updates"""
    with patch("user_profile.main_routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("user_profile.main_routes.users_collection") as mock_users_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_user
        
        # Test data with invalid email
        update_data = {
            "email": "invalid@gmail.com"  # Not ending with @sabanciuniv.edu
        }
        
        # Make the request
        response = client.put("/update_user_info", json=update_data)
        
        # Assertions
        assert response.status_code == 400
        assert "Email must be a valid sabanciuniv.edu address" in response.json()["detail"]

# Core test 9: Favorites management
@pytest.mark.asyncio
async def test_add_to_favorites():
    """Test adding a product to user's favorites"""
    with patch("products.routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("products.routes.users_collection") as mock_users_collection, \
         patch("products.routes.item_collection") as mock_item_collection:
        
        # Set up mocks
        mock_users_collection.find_one.return_value = sample_user
        mock_item_collection.find_one = AsyncMock(return_value=sample_product)
        mock_users_collection.update_one = AsyncMock()
        
        # Make the request
        response = client.post("/add_to_favorites?product_id=item123")
        
        # Assertions
        assert response.status_code == 200
        assert "Product added to favorites" in response.json()["message"]
        mock_item_collection.find_one.assert_called_once()

@pytest.mark.asyncio
async def test_remove_from_favorites():
    """Test removing a product from user's favorites"""
    with patch("products.routes.get_current_user", return_value={"user_id": "user123"}), \
         patch("products.routes.users_collection") as mock_users_collection:
        
        # Set up mocks
        user_with_favorites = dict(sample_user)
        product_with_id = dict(sample_product)
        product_with_id["item_id"] = "item123"
        user_with_favorites["favorites"] = [product_with_id]
        mock_users_collection.find_one.return_value = user_with_favorites
        mock_users_collection.update_one = AsyncMock()
        
        # Make the request
        response = client.post("/remove_from_favorites?product_id=item123")
        
        # Assertions
        assert response.status_code == 200
        assert "Product removed from favorites" in response.json()["message"]
        mock_users_collection.update_one.assert_called_once()





# ----------------------------------------- PRODUCT TESTS -----------------------------------------





# ----------------------------------------- PURCHASE TESTS -----------------------------------------
