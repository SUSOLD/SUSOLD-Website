import { useEffect, useState } from "react";
import axios from "axios";

const PurchasePage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCreditCard, setSelectedCreditCard] = useState('');
  const [message, setMessage] = useState('');
  const [orderHistory, setOrderHistory] = useState([]);

  const token = localStorage.getItem('accessToken');
  const tokenType = localStorage.getItem('tokenType');

  const authHeader = token && tokenType ? { Authorization: `${tokenType} ${token}` } : {};

  useEffect(() => {
    fetchCartItems();
    fetchUserDropdownData();
    fetchOrderHistory();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/cart-items', { headers: authHeader });
      setCartItems(response.data.item_names);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const fetchUserDropdownData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/user-dropdown-data', { headers: authHeader });
      setAddresses(response.data.addresses);
      setCreditCards(response.data.credit_cards);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/order-history', { headers: authHeader });
      setOrderHistory(response.data.order_items);
    } catch (error) {
      console.error("Error fetching order history:", error);
    }
  };

  const handleOrder = async () => {
    try {
      const response = await axios.post(
        'http://localhost:8000/api/complete-order',
        {
          selected_address: selectedAddress,
          selected_credit_card: selectedCreditCard
        },
        { headers: authHeader } // 🛡 burada da ekledik
      );
      setMessage(response.data.message);
      fetchCartItems();
      fetchOrderHistory();
    } catch (error) {
      console.error("Error completing order:", error);
      setMessage(error.response?.data?.detail || "Error completing order");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "20px" }}>
      {/* Upper part: Cart and Purchase */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        
        {/* Cart Content */}
        <div style={{ width: "45%" }}>
          <h2>Cart Content</h2>
          {cartItems.length === 0 ? (
            <p>Cart is empty!</p>
          ) : (
            <ul>
              {cartItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Purchase Section */}
        <div style={{ width: "45%" }}>
          <h2>Complete Your Order</h2>
          <div>
            <label>Shipping Address:</label>
            <select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
              <option value="">Select an address</option>
              {addresses.map((addr, idx) => (
                <option key={idx} value={addr}>{addr}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "20px" }}>
            <label>Credit Card:</label>
            <select value={selectedCreditCard} onChange={(e) => setSelectedCreditCard(e.target.value)}>
              <option value="">Select a credit card</option>
              {creditCards.map((card, idx) => (
                <option key={idx} value={card}>{card}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOrder}
            style={{ marginTop: "30px", padding: "10px 20px", fontSize: "16px" }}
            disabled={!selectedAddress || !selectedCreditCard}
          >
            Complete Purchase
          </button>

          {message && (
            <p style={{ marginTop: "20px", color: "green" }}>{message}</p>
          )}
        </div>
      </div>

      {/* Order History Section */}
      <div style={{ marginTop: "40px" }}>
        <h2>Order History</h2>
        {orderHistory.length === 0 ? (
          <p>No previous orders found.</p>
        ) : (
          <ul>
            {orderHistory.map((item, index) => (
              <li key={index}>
                {item.item_name} - Status: {item.isSold}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PurchasePage;
