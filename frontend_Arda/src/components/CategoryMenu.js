import React from 'react';

const CategoryMenu = ({ activeCategory, setActiveCategory }) => {
  const categories = ['All', 'Dormitory', 'Books', 'Clothing', 'Electronic'];

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
  }
};

export default CategoryMenu;
