import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import ProductDetail from '../pages/ProductDetail.jsx'; // Detay sayfası için örnek

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
        <Route
          path="/product/:itemId"
          element={<ProductDetail />}
        />
      </Routes>
    </Router>
  );
}

export default App;