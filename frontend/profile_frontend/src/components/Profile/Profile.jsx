// frontend/profile_frontend/src/components/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import AuthService from '../../services/AuthService';
import './Profile.css';
import Logo from '../../components/common/Logo';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Static example data
        setUser({
          name: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          joinDate: '01.01.2023',
          lastLogin: '25.04.2025',
          orders: 12,
          addresses: ['New York, USA'],
          creditCards: [{
            last4: '1234',
            brand: 'Visa'
          }]
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('An error occurred while retrieving user information.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-container">
          <div className="error-icon">!</div>
          <h3>Error Occurred</h3>
          <p className="error-message">{error}</p>
          <button className="primary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <div className="brand-header" style={{ margin: 0 }}>
            <Logo width={32} height={32} className="header-logo" />
            <h1 className="brand">SUSOLD</h1>
          </div>
          <nav className="profile-nav">
            <a href="#" className="nav-item active">Profile</a>
            <a href="#" className="nav-item">My Orders</a>
            <a href="#" className="nav-item">Favorites</a>
            <a href="#" className="nav-item">Settings</a>
          </nav>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
    
      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() + user.lastname.charAt(0).toUpperCase() : 'JD'}
            </div>
            <h2 className="user-name">{user?.name} {user?.lastname}</h2>
            <p className="user-email">{user?.email}</p>
          </div>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{user?.orders || 0}</span>
              <span className="stat-label">Orders</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{user?.joinDate}</span>
              <span className="stat-label">Member Since</span>
            </div>
          </div>
          
          <div className="profile-menu">
            <a href="#" className="menu-item active">
              <i className="menu-icon profile-icon"></i>
              <span>Profile Information</span>
            </a>
            <a href="#" className="menu-item">
              <i className="menu-icon orders-icon"></i>
              <span>My Orders</span>
            </a>
            <a href="#" className="menu-item">
              <i className="menu-icon address-icon"></i>
              <span>My Addresses</span>
            </a>
            <a href="#" className="menu-item">
              <i className="menu-icon payment-icon"></i>
              <span>Payment Methods</span>
            </a>
            <a href="#" className="menu-item">
              <i className="menu-icon settings-icon"></i>
              <span>Account Settings</span>
            </a>
          </div>
        </div>
        
        <div className="profile-main">
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Profile Information</h3>
              <button className="edit-button">Edit</button>
            </div>
            
            <div className="profile-details">
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-label">First Name</span>
                  <span className="detail-value">{user?.name || 'N/A'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Last Name</span>
                  <span className="detail-value">{user?.lastname || 'N/A'}</span>
                </div>
              </div>
              
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{user?.email || 'N/A'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Last Login</span>
                  <span className="detail-value">{user?.lastLogin || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Saved Addresses</h3>
              <button className="edit-button">Add New</button>
            </div>
            
            <div className="addresses-list">
              {user?.addresses && user.addresses.length > 0 ? (
                user.addresses.map((address, index) => (
                  <div className="address-card" key={index}>
                    <div className="address-header">
                      <h4>Address {index + 1}</h4>
                      <div className="address-actions">
                        <button className="action-button edit">Edit</button>
                        <button className="action-button delete">Delete</button>
                      </div>
                    </div>
                    <p className="address-text">{address}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>You don't have any saved addresses yet.</p>
                  <button className="primary-button">Add Address</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Saved Payment Methods</h3>
              <button className="edit-button">Add New</button>
            </div>
            
            <div className="payment-methods">
              {user?.creditCards && user.creditCards.length > 0 ? (
                user.creditCards.map((card, index) => (
                  <div className="card-item" key={index}>
                    <div className="card-brand">{card.brand}</div>
                    <div className="card-number">**** **** **** {card.last4}</div>
                    <div className="card-actions">
                      <button className="action-button delete">Remove</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>You don't have any saved payment methods yet.</p>
                  <button className="primary-button">Add Payment Method</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;