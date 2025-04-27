import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductList = ({ items, searchTerm, activeTab, activeCategory, isLoggedIn }) => {
  const navigate = useNavigate();

  const filtered = items.filter((item) => {
    const matchesSearch = searchTerm ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesTab =
      activeTab === 'Favorites'
        ? item.isFavorite
        : activeTab === 'Verified Sellers'
        ? item.verified
        : true;
    const matchesCategory =
      activeCategory === 'All' ? true : item.category === activeCategory;

    return matchesSearch && matchesTab && matchesCategory;
  });

  return (
    <section style={styles.products}>
      <h3>Products</h3>
      <div style={styles.productGrid}>
        {filtered.map((item) => (
          <div
            key={item.item_id}
            style={styles.card}
            onClick={() => navigate(`/item/${item.item_id}`)} // ✅ Clickable
          >
            <img
              src={item.image}
              alt={item.title}
              style={{ width: '100px', height: '100px' }}
            />
            <p><b>{item.title}</b></p>
            <p>{item.condition} 👍</p>
            <p>{item.price} TL</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const styles = {
  products: {
    marginTop: 20,
    padding: 10
  },
  productGrid: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap'
  },
  card: {
    border: '1px solid black',
    padding: 10,
    width: 150,
    textAlign: 'center',
    cursor: 'pointer'
  }
};

export default ProductList;
