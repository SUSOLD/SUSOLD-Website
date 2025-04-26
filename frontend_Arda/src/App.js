import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import BasketPage from './pages/BasketPage';
import ProductDetail from './pages/ProductDetail';
import UpdateProductPage from './pages/UpdateProductPage'; // ✅ new

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('Sales');
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8001/api/home/')
      .then(response => response.json())
      .then(data => {
        setItems(data.featured_products || []);
        console.log('Fetched items:', data.featured_products);
      })
      .catch(error => console.error('Error fetching data:', error));
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
            />
          }
        />
        <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/basket" element={<BasketPage />} />
        <Route path="/item/:itemId" element={<ProductDetail />} />            {/* ✅ view product */}
        <Route path="/edit/:itemId" element={<UpdateProductPage />} />        {/* ✅ edit product */}
      </Routes>
    </Router>
  );
}

export default App;
