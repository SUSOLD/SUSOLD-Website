import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage'; 
import UserProfile from './pages/UserProfile';
import BasketPage from './pages/BasketPage';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import AuthService from './services/AuthService';
import ProductDetail from './pages/ProductDetail';
import PurchasePage from "./pages/PurchasePage";

import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Sales');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isLoggedIn());

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Home page */}
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

          {/* Profile page (protected) */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          

          {/* Basket page */}
          <Route 
            path="/basket" 
            element={
              AuthService.isLoggedIn() ? <PurchasePage /> : <BasketPage />
            } 
          />


          {/* Add Product (protected) */}
          <Route 
            path="/add-product" 
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            } 
          />

          {/* Edit Product (protected) */}
          <Route 
            path="/edit-product/:productId" 
            element={
              <ProtectedRoute>
                <EditProduct />
              </ProtectedRoute>
            } 
          />

          {/* Login page */}
          <Route path="/login" element={<LoginForm />} />

          {/* Register page */}
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/item/:itemId" element={<ProductDetail />} /> 

          {/* 404 */}
          <Route path="*" element={
            <div className="not-found-container">
              <div className="not-found-content">
                <h1>404</h1>
                <h2>Page Not Found</h2>
                <p>The page you are looking for doesn't exist or has been moved.</p>
                <a href="/" className="return-home-btn">Return to Home</a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
