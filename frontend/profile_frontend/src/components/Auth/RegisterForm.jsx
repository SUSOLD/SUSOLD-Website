import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';
import Logo from '../../components/common/Logo';

const API_URL = 'http://localhost:8000/api';
const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: ''
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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const userData = {
        name: formData.name,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
        photo: [],
        credit_cards: [],
        addresses: []
      };

      await axios.post(`${API_URL}/register`, userData);
      
      navigate('/login', { state: { message: 'Registration successful! You can now login.' } });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'An error occurred during registration.');
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
        
        <h2 className="form-title">Create New Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">First Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your first name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastname">Last Name</label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                placeholder="Your last name"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
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
                placeholder="At least 6 characters"
                required
                minLength="6"
              />
              <i className="input-icon password-icon"></i>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                minLength="6"
              />
              <i className="input-icon password-icon"></i>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <a href="/login" className="auth-link">Login</a></p>
        </div>
      </div>
      
      <div className="auth-info">
        <p>By registering with SUSOLD, you'll enjoy these benefits:</p>
        <div className="auth-features">
          <div className="feature">
            <i className="feature-icon order-icon"></i>
            <span>Track your orders</span>
          </div>
          <div className="feature">
            <i className="feature-icon wishlist-icon"></i>
            <span>Save your favorite products</span>
          </div>
          <div className="feature">
            <i className="feature-icon discount-icon"></i>
            <span>Get exclusive discounts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;