import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ setSearchTerm }) => {
  const navigate = useNavigate();

  return (
    <header style={styles.navbar}>
      <div style={styles.logo}>Susold</div>
      <input
        style={styles.search}
        type="text"
        placeholder="Hinted search text"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div style={styles.navIcons}>
        <span onClick={() => navigate('/profile')} style={styles.clickable}>👤 Profile</span>
        <span onClick={() => navigate('/basket')} style={styles.clickable}>🛒 Basket</span>
      </div>
    </header>
  );
};

const styles = {
  navbar: {
    display: 'flex', justifyContent: 'space-between', padding: 10, backgroundColor: '#ffe4ec'
  },
  logo: {
    fontWeight: 'bold', fontSize: 18
  },
  search: {
    flex: 1, margin: '0 10px'
  },
  navIcons: {
    display: 'flex', gap: '10px'
  },
  clickable: {
    cursor: 'pointer', textDecoration: 'underline'
  }
};

export default Navbar;