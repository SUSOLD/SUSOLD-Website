import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import UserProfile from './pages/UserProfile';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct'; // Add this import
import AuthService from './services/AuthService';
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
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Login page */}
          <Route path="/login" element={<LoginForm />} />

          {/* Register page */}
          <Route path="/register" element={<RegisterForm />} />

          {/* Profile page (protected) */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />

          {/* Add Product page (protected) */}
          <Route 
            path="/add-product" 
            element={
              <ProtectedRoute>
                <AddProduct />
              </ProtectedRoute>
            } 
          />

          {/* Edit Product page (protected) */}
          <Route 
            path="/edit-product/:productId" 
            element={
              <ProtectedRoute>
                <EditProduct />
              </ProtectedRoute>
            } 
          />

          {/* Home page redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 page */}
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