import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/home/item/${itemId}`)
      .then(res => res.json())
      .then(data => setProduct(data))
      .catch(err => console.error('Error loading product:', err));

    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [itemId]);

  // Add to favorites
  const handleAddToFavorites = async () => {
    if (!isLoggedIn) {
      alert('Please login to add to favorites.');
      navigate('/login');
      return;
    }

    await fetch(`http://127.0.0.1:8000/api/favorites/${itemId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    alert('Added to favorites!');
  };

  const handleAddToBasket = async () => {
    if (!isLoggedIn) {
      alert('Please login to add to basket.');
      navigate('/login');
      return;
    }

    await fetch(`http://127.0.0.1:8000/api/basket/${itemId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    alert('Added to basket!');
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{product.title}</h2>
      <img src={product.image} alt={product.title} style={{ width: '200px' }} />
      <p><b>Description:</b> {product.description}</p>
      <p><b>Price:</b> {product.price} TL</p>
      <p><b>Condition:</b> {product.condition}</p>
      <p><b>Brand:</b> {product.brand}</p>
      <p><b>Category:</b> {product.category} / {product.sub_category}</p>
      <p><b>Age:</b> {product.age} years</p>
      <p><b>Returnable:</b> {product.returnable ? 'Yes' : 'No'}</p>
      <p><b>Verified:</b> {product.verified ? 'Yes' : 'No'}</p>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleAddToFavorites} style={styles.buttonSecondary}>Add to Favorites</button>
        <button onClick={handleAddToBasket} style={styles.buttonPrimary}>Add to Basket</button>
      </div>
    </div>
  );
};

const styles = {
  buttonPrimary: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};

export default ProductDetail;