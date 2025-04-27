import React from 'react';

const CategoryMenu = ({ activeCategory, setActiveCategory, openSortFilter }) => {
  const categories = ['All', 'Books', 'Clothing', 'Electronics', 'Furniture', 'Sports', 'Others'];

  return (
    <nav style={styles.menu}>
      {categories.map((category, index) => (
        <span
          key={index}
          onClick={() => setActiveCategory(category)}
          style={{
            ...styles.item,
            color: activeCategory === category ? 'white' : 'black',
            backgroundColor: activeCategory === category ? 'black' : 'transparent',
            padding: '4px 10px',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          {category}
        </span>
      ))}
      <button onClick={openSortFilter} style={styles.sortButton}>
        Sort & Filter
      </button>
    </nav>
  );
};

const styles = {
  menu: {
    display: 'flex',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10
  },
  item: {
    fontWeight: 'bold'
  },
  sortButton: {
    backgroundColor: '#f0f0f0',
    color: 'black',
    padding: '4px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid black'
  }
};

export default CategoryMenu;