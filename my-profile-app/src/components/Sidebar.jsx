// Sidebar.js
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, onNavigate }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="close-btn" onClick={toggleSidebar}>✕</button>
      <ul>
        <li onClick={() => onNavigate('profile')}>My Profile</li>
        <li onClick={() => onNavigate('purchases')}>Purchases</li>
        <li onClick={() => onNavigate('favorites')}>Favorites</li>
      </ul>
    </div>
  );
};

export default Sidebar;
