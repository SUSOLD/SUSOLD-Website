import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import Logo from '../../components/common/Logo';

const API_URL = 'http://localhost:8000/api';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/token`, 
        new URLSearchParams({
          'username': formData.username,
          'password': formData.password
        }), 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        } 
      );

      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('tokenType', response.data.token_type);
      
      navigate('/profile');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="brand-header">
          <Logo width={48} height={48} className="brand-logo" />
          <h1 className="brand-name">SUSOLD</h1>
        </div>
        
        <h2 className="form-title">Login to Your Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <div className="input-with-icon">
              <input
                type="email"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
              <i className="input-icon email-icon"></i>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <i className="input-icon password-icon"></i>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <a href="/register" className="auth-link">Register</a></p>
        </div>
      </div>
      
      <div className="auth-info">
        <p>Shop securely with SUSOLD</p>
        <div className="auth-features">
          <div className="feature">
            <i className="feature-icon secure-icon"></i>
            <span>Secure Payment</span>
          </div>
          <div className="feature">
            <i className="feature-icon fast-icon"></i>
            <span>Fast Delivery</span>
          </div>
          <div className="feature">
            <i className="feature-icon quality-icon"></i>
            <span>Quality Products</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;