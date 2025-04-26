import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import BasketPage from './pages/BasketPage';
import ProductDetail from './pages/ProductDetail';
import UpdateProductPage from './pages/UpdateProductPage'; 

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('Sales');
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState([]);
  const [token, setToken] = useState('');  
  const [currentUserId, setCurrentUserId] = useState(''); 

  // Fetch items
  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/home/')
      .then(response => response.json())
      .then(data => {
        setItems(data.featured_products || []);
        console.log('Fetched items:', data.featured_products);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Fetch current user info if token exists
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);

      fetch('http://127.0.0.1:8001/api/my_name', {
        headers: {
          Authorization: `Bearer ${savedToken}`
        }
      })
        .then(res => res.json())
        .then(userData => {
          // ⚡ Instead of name/lastname, fetch user_id properly if needed
          fetch('http://127.0.0.1:8001/api/get-user-data', {
            headers: {
              Authorization: `Bearer ${savedToken}`
            }
          })
            .then(res => res.json())
            .then(realUser => {
              if (realUser && realUser.user_id) {
                setCurrentUserId(realUser.user_id);
              }
            })
            .catch(err => console.error('Error fetching user id:', err));
        })
        .catch(err => console.error('Error fetching user info:', err));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isLoggedIn={isLoggedIn}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              items={items}
              currentUserId={currentUserId}   // ✅ Pass to HomePage if needed later
            />
          }
        />
        <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route
          path="/login"
          element={<LoginPage setIsLoggedIn={setIsLoggedIn} setToken={setToken} />}
        />
        <Route path="/basket" element={<BasketPage />} />
        <Route
          path="/item/:itemId"
          element={
            <ProductDetail
              currentUserId={currentUserId}
              token={token}
              isLoggedIn={isLoggedIn}
            />
          }
        />
        <Route
          path="/edit/:itemId"
          element={
            <UpdateProductPage
              token={token}
              isLoggedIn={isLoggedIn}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
