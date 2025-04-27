import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import ProductDetail from '../pages/ProductDetail.jsx';
import ProfilePage from '../pages/ProfilePage.jsx'; // ProfilePage'i doğru import edin
import BasketPage from '../pages/BasketPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Sales');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              isLoggedIn={isLoggedIn}
            />
          }
        />
        {/* Profile page route */}
        <Route 
          path="/profile" 
          element={<ProfilePage />} 
        />
        <Route 
          path="/product/:itemId" 
          element={<ProductDetail />} 
        />
        <Route 
          path="/basket" 
          element={<BasketPage />} 
        />
        <Route 
          path="/login" 
          element={<LoginPage />} 
        />
      </Routes>
    </Router>
  );
}

export default App;