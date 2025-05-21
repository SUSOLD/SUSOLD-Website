
import pytest
from httpx import AsyncClient, ASGITransport
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta, timezone
from backend.main import app
from backend.registerloginbackend.jwt_handler import get_current_user

mock_user = {
    "email": "test@sabanciuniv.edu",
    "user_id": "user12345",
    "id": "abc",
    "isManager": True,
    "isSalesManager": True,
    "credit_cards": [],
    "addresses": []
}

@pytest.fixture(autouse=True)
def override_get_current_user():
    app.dependency_overrides = {}
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides = {}

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ------------------ get-users-orders ------------------
@pytest.mark.asyncio
async def test_get_user_orders_not_found(client: AsyncClient):
    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=None)):
        response = await client.get("/api/user-orders")
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_get_user_orders_success(client: AsyncClient):
    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=mock_user)), \
         patch("backend.database.order_collection.find") as mock_find_orders, \
         patch("backend.database.item_collection.find_one", AsyncMock(return_value={"item_id": "item1", "isSold": "processing"})), \
         patch("backend.database.refund_collection.find_one", AsyncMock(return_value=None)):

        mock_find_orders.return_value.to_list = AsyncMock(return_value=[{
            "order_id": "ord123",
            "user_id": "user12345",
            "date": datetime.now(timezone.utc),
            "item_ids": ["item1"],
            "shipping_address": "Test Address"
        }])

        response = await client.get("/api/user-orders")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "processing"


# ------------------ get-all-orders ------------------
@pytest.mark.asyncio
async def test_get_all_orders_not_manager(client: AsyncClient):
    user = mock_user.copy()
    user["isManager"] = False

    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=user)):
        response = await client.get("/api/all-orders")
        assert response.status_code == 403

@pytest.mark.asyncio
async def test_get_all_orders_success(client: AsyncClient):
    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=mock_user)), \
         patch("backend.database.order_collection.find") as mock_find_orders, \
         patch("backend.database.item_collection.find_one", AsyncMock(return_value={
             "item_id": "item1",
             "title": "Test Product",
             "image": ["img.png"],
             "price": 50,
             "category": "Book",
             "isSold": "delivered",
             "inStock": True
         })):

        mock_find_orders.return_value.to_list = AsyncMock(return_value=[{
            "order_id": "ord123",
            "user_id": "user12345",
            "date": datetime.now(timezone.utc),
            "item_ids": ["item1"],
            "shipping_address": "Test Address"
        }])

        response = await client.get("/api/all-orders")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["order_id"] == "ord123"


# ------------------ set-price ------------------
@pytest.mark.asyncio
async def test_get_items_without_price_unauthorized(client: AsyncClient):
    user = mock_user.copy()
    user["isSalesManager"] = False

    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=user)):
        response = await client.get("/api/items-without-price")
        assert response.status_code == 403

@pytest.mark.asyncio
async def test_set_price_already_set(client: AsyncClient):
    item = {"item_id": "item1", "price": 50}

    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=mock_user)),          patch("backend.database.item_collection.find_one", AsyncMock(return_value=item)):

        response = await client.post("/api/set-price/item1?price=99.99")
        assert response.status_code == 400
        assert "already has a price" in response.text

@pytest.mark.asyncio
async def test_set_price_success(client: AsyncClient):
    item = {"item_id": "item1", "price": 0}

    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=mock_user)),          patch("backend.database.item_collection.find_one", AsyncMock(return_value=item)),          patch("backend.database.item_collection.update_one", AsyncMock()):

        response = await client.post("/api/set-price/item1?price=99.99")
        assert response.status_code == 200
        assert "set to 99.99" in response.json()["message"]


# ------------------ cancel-order ------------------
@pytest.mark.asyncio
async def test_cancel_order_invalid_status(client: AsyncClient):
    order = {"order_id": "ord123", "user_id": "user12345", "item_ids": ["item1"]}
    item = {"item_id": "item1", "isSold": "delivered"}

    with patch("backend.database.order_collection.find_one", AsyncMock(return_value=order)),          patch("backend.database.item_collection.find_one", AsyncMock(return_value=item)):

        response = await client.post("/api/cancel-order/ord123")
        assert response.status_code == 400
        assert "cannot be canceled" in response.text

@pytest.mark.asyncio
async def test_cancel_order_success(client: AsyncClient):
    order = {
        "order_id": "ord123",
        "user_id": "user12345",
        "item_ids": ["item1"]
    }
    item = {"item_id": "item1", "isSold": "processing"}

    with patch("backend.database.order_collection.find_one", AsyncMock(return_value=order)), \
         patch("backend.database.item_collection.find_one", AsyncMock(return_value=item)), \
         patch("backend.database.order_collection.delete_one", AsyncMock()), \
         patch("backend.database.item_collection.update_one", AsyncMock()):

        response = await client.post("/api/cancel-order/ord123")
        assert response.status_code == 200
        assert "successfully canceled" in response.json()["message"]


# ------------------ refund-request ------------------
@pytest.mark.asyncio
async def test_refund_item_not_in_order(client: AsyncClient):
    order = {
        "order_id": "ord123",
        "user_id": "user12345",
        "item_ids": ["item1"],
        "date": datetime.now(timezone.utc)
    }

    with patch("backend.database.order_collection.find_one", AsyncMock(return_value=order)):
        response = await client.post("/api/refund-request/ord123", json={"item_ids": ["item2"]})
        assert response.status_code == 400
        assert "do not belong to the order" in response.text

@pytest.mark.asyncio
async def test_refund_item_not_delivered(client: AsyncClient):
    now = datetime.now(timezone.utc) - timedelta(days=5)
    order = {
        "order_id": "ord123",
        "user_id": "user12345",
        "item_ids": ["item1"],
        "date": now
    }
    item = {"item_id": "item1", "isSold": "inTransit", "price": 100}

    with patch("backend.database.order_collection.find_one", AsyncMock(return_value=order)),          patch("backend.database.item_collection.find_one", AsyncMock(return_value=item)):

        response = await client.post("/api/refund-request/ord123", json={"item_ids": ["item1"]})
        assert response.status_code == 400
        assert "not eligible for return" in response.text

@pytest.mark.asyncio
async def test_refund_request_valid(client: AsyncClient):
    order = {
        "order_id": "ord123",
        "user_id": "user12345",
        "item_ids": ["item1"],
        "date": datetime.now(timezone.utc) - timedelta(days=5)
    }
    item = {"item_id": "item1", "isSold": "delivered", "price": 100}

    with patch("backend.database.order_collection.find_one", AsyncMock(return_value=order)), \
         patch("backend.database.item_collection.find_one", AsyncMock(return_value=item)), \
         patch("backend.database.refund_collection.insert_one", AsyncMock()):

        response = await client.post("/api/refund-request/ord123", json={"item_ids": ["item1"]})
        assert response.status_code == 200
        assert "Refund request submitted" in response.json()["message"]

@pytest.mark.asyncio
async def test_get_refund_requests_not_sales_manager(client: AsyncClient):
    user = mock_user.copy()
    user["isSalesManager"] = False

    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=user)):
        response = await client.get("/api/refund-requests")
        assert response.status_code == 403

@pytest.mark.asyncio
async def test_handle_refund_request_already_processed(client: AsyncClient):
    refund_doc = {
        "order_id": "ord123",
        "user_id": "user12345",
        "item_ids": ["item1"],
        "status": "approved"
    }
    with patch("backend.database.users_collection.find_one", AsyncMock(return_value=mock_user)),          patch("backend.database.refund_collection.find_one", AsyncMock(return_value=refund_doc)):

        response = await client.post("/api/handle-refund-request/ord123?action=approve")
        assert response.status_code == 400
        assert "already processed" in response.text

@pytest.mark.asyncio
async def test_handle_refund_request_approve(client: AsyncClient):
    refund_doc = {
        "order_id": "ord123",
        "user_id": "user12345",
        "item_ids": ["item1"],
        "refund_amount": 100,
        "status": "pending"
    }
    item = {"item_id": "item1", "isSold": "delivered", "price": 100}
    user_doc = {"user_id": "user12345", "name": "Test", "email": "test@sabanciuniv.edu"}

    with patch("backend.database.users_collection.find_one", AsyncMock(side_effect=[mock_user, user_doc])),          patch("backend.database.refund_collection.find_one", AsyncMock(return_value=refund_doc)),          patch("backend.database.item_collection.update_one", AsyncMock()),          patch("backend.database.refund_collection.update_one", AsyncMock()),          patch("backend.UserProfile_backend.main_routes.send_email_notification", AsyncMock()):

        response = await client.post("/api/handle-refund-request/ord123?action=approve")
        assert response.status_code == 200
        assert "approved" in response.json()["message"]

@pytest.mark.asyncio
async def test_handle_refund_request_reject(client: AsyncClient):
    refund_doc = {
        "order_id": "ord123",
        "user_id": "user12345",
        "item_ids": ["item1"],
        "refund_amount": 100,
        "status": "pending"
    }
    user_doc = {"user_id": "user12345", "name": "Test", "email": "test@sabanciuniv.edu"}

    with patch("backend.database.users_collection.find_one", AsyncMock(side_effect=[mock_user, user_doc])), \
         patch("backend.database.refund_collection.find_one", AsyncMock(return_value=refund_doc)), \
         patch("backend.database.refund_collection.update_one", AsyncMock()), \
         patch("backend.UserProfile_backend.main_routes.send_email_notification", AsyncMock()):

        response = await client.post("/api/handle-refund-request/ord123?action=reject")
        assert response.status_code == 200
        assert "rejected" in response.json()["message"]
