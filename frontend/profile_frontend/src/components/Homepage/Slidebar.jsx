import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.sidebar} role="navigation">
        <button onClick={onClose} style={styles.close} aria-label="Close Sidebar">✖</button>
        <ul style={styles.menu}>
          <li onClick={() => { navigate('/profile'); onClose(); }}>👤 My Profile</li>
          <li onClick={() => { navigate('/purchases'); onClose(); }}>📦 Purchases</li>
          <li onClick={() => { navigate('/favorites'); onClose(); }}>❤️ Favorites</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10
  },
  sidebar: {
    position: 'relative',
    width: '250px', height: '100%', backgroundColor: 'white',
    padding: '20px', boxShadow: '2px 0 5px rgba(0,0,0,0.3)'
  },
  close: {
    position: 'absolute', top: 10, right: 10,
    background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer'
  },
  menu: {
    listStyle: 'none', padding: 0, marginTop: 40,
    display: 'flex', flexDirection: 'column', gap: 15, cursor: 'pointer'
  }
};

export default Sidebar;
