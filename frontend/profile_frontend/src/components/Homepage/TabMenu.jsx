import React from 'react';

const TabMenu = ({ activeTab, setActiveTab }) => {
  const tabs = ['Sales', 'Favorites', 'Verified Sellers'];

  return (
    <div style={styles.tabs}>
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => setActiveTab(tab)}
          style={
            activeTab === tab ? styles.activeTab : styles.tab
          }
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

const styles = {
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20
  },
  tab: {
    padding: '5px 10px',
    border: '1px solid black',
    borderRadius: 10,
    background: 'white',
    cursor: 'pointer'
  },
  activeTab: {
    padding: '5px 10px',
    backgroundColor: 'black',
    color: 'white',
    borderRadius: 10,
    cursor: 'pointer'
  }
};

export default TabMenu;