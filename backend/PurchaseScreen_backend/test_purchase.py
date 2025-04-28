import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from backend.PurchaseScreen_backend.purchase import (
    get_cart_items, get_user_dropdown_data, complete_order, get_order_history, debug_all
)
from fastapi import HTTPException

# Patch database collections globally
@pytest_asyncio.fixture(autouse=True)
def mock_db_collections():
    with patch("backend.PurchaseScreen_backend.purchase.users_collection", new_callable=MagicMock) as users_collection_mock, \
         patch("backend.PurchaseScreen_backend.purchase.item_collection", new_callable=MagicMock) as item_collection_mock, \
         patch("backend.PurchaseScreen_backend.purchase.order_collection", new_callable=MagicMock) as order_collection_mock:
        yield users_collection_mock, item_collection_mock, order_collection_mock

# 1
@pytest.mark.asyncio
async def test_get_cart_items_empty_basket(mock_db_collections):
    users_collection_mock, item_collection_mock, order_collection_mock = mock_db_collections

    current_user = {"user_id": "user123", "basket": []}

    response = await get_cart_items(current_user)

    assert response == {"item_names": []}

# 2
@pytest.mark.asyncio
async def test_get_cart_items_with_items(mock_db_collections):
    users_collection_mock, item_collection_mock, order_collection_mock = mock_db_collections

    current_user = {"user_id": "user123", "basket": ["item1", "item2"]}

    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[
        {"item_name": "Item One"},
        {"item_name": "Item Two"}
    ])
    item_collection_mock.find.return_value = mock_cursor

    response = await get_cart_items(current_user)

    assert response == {"item_names": ["Item One", "Item Two"]}

# 3
@pytest.mark.asyncio
async def test_get_user_dropdown_data(mock_db_collections):
    current_user = {
        "credit_cards": ["Card1", "Card2"],
        "addresses": ["Address1", "Address2"]
    }

    response = await get_user_dropdown_data(current_user)

    assert response == {
        "credit_cards": ["Card1", "Card2"],
        "addresses": ["Address1", "Address2"]
    }

# 4
@pytest.mark.asyncio
async def test_complete_order_empty_basket(mock_db_collections):
    users_collection_mock, item_collection_mock, order_collection_mock = mock_db_collections

    current_user = {"user_id": "user123", "basket": []}
    data = MagicMock(selected_address="Addr", selected_credit_card="Card")

    with pytest.raises(HTTPException) as exc_info:
        await complete_order(data, current_user)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Cart is empty, cannot create order"

# 5
@pytest.mark.asyncio
async def test_get_order_history_empty(mock_db_collections):
    users_collection_mock, item_collection_mock, order_collection_mock = mock_db_collections

    current_user = {"user_id": "user123"}

    order_collection_mock.find.return_value = MagicMock()
    order_collection_mock.find.return_value.to_list = AsyncMock(return_value=[])

    response = await get_order_history(current_user)

    assert response == {"order_items": []}

# 6
@pytest.mark.asyncio
async def test_get_order_history_with_items(mock_db_collections):
    users_collection_mock, item_collection_mock, order_collection_mock = mock_db_collections

    current_user = {"user_id": "user123"}

    order_collection_mock.find.return_value = MagicMock()
    order_collection_mock.find.return_value.to_list = AsyncMock(return_value=[
        {"item_ids": ["item1", "item2"]}
    ])

    item_collection_mock.find.return_value = MagicMock()
    item_collection_mock.find.return_value.to_list = AsyncMock(return_value=[
        {"item_name": "Item One", "isSold": "processing"},
        {"item_name": "Item Two", "isSold": "processing"}
    ])

    response = await get_order_history(current_user)

    assert response == {
        "order_items": [
            {"item_name": "Item One", "isSold": "processing"},
            {"item_name": "Item Two", "isSold": "processing"}
        ]
    }