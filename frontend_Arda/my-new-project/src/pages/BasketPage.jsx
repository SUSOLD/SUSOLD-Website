import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBasketLocal } from '../utils/basketUtils'; 

const BasketPage = () => {
  const [basketItems, setBasketItems] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  
    if (token) {
      // User logged in - before fetching basket, sync local basket
      const localBasket = getBasketLocal();
      if (localBasket.length > 0) {
        // Sync each item to server
        Promise.all(
          localBasket.map(id =>
            fetch(`http://127.0.0.1:8001/api/basket/${id}`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
          )
        )
        .then(() => {
          clearBasketLocal(); 
        })
        .catch(err => console.error('Error syncing basket:', err));
      }
  
      fetch('http://127.0.0.1:8001/api/basket', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setBasketItems(data.basket || []))
        .catch(error => console.error('Error loading basket:', error));
    } else {
      // User not logged in - show local basket
      const localBasketIds = getBasketLocal();
      if (localBasketIds.length > 0) {
        Promise.all(
          localBasketIds.map(id =>
            fetch(`http://127.0.0.1:8001/api/home/item/${id}`).then(res => res.json())
          )
        )
          .then(products => setBasketItems(products))
          .catch(error => console.error('Error loading local basket:', error));
      }
    }
  }, []);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Basket</h2>
      {basketItems.length === 0 ? (
        <p>Your basket is empty.</p>
      ) : (
        <div>
          {basketItems.map(item => (
            <div key={item.item_id} style={{ borderBottom: '1px solid #ccc', marginBottom: '10px', paddingBottom: '10px' }}>
              <h3>{item.title}</h3>
              <img src={item.image} alt={item.title} style={{ width: '100px' }} />
              <p>Price: {item.price} TL</p>
            </div>
          ))}
          {!isLoggedIn && (
            <button onClick={handleGoToLogin} style={styles.loginButton}>
              Login to Complete Purchase
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  loginButton: {
    marginTop: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};

export default BasketPage;
