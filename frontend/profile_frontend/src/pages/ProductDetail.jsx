import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addToBasketLocal } from '../services/apiService'; // ✅ Import local basket function
import { basketAPI } from '../services/apiService';


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

  const handleAddToFavorites = async () => {
    if (!isLoggedIn) {
      alert('Please login to add favorites.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/favorites/${itemId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Added to favorites!');
      } else {
        alert('Failed to add to favorites.');
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Error adding to favorites.');
    }
  };

  const handleAddToBasket = async (itemId) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await basketAPI.toggleBasketItem(itemId);
        alert('Item added to basket!');
      } catch (error) {
        console.error('Error adding item to basket:', error);
        alert('Failed to add item to basket. Please login again.');
      }
    } else {
      addToBasketLocal(itemId);
      alert('Item added to basket!');
    }
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
      <p><b>Age:</b> {product.age}</p>
      <p><b>Dorm item:</b> {product.dorm ? 'Yes' : 'No'}</p>
      <p><b>Course item:</b> {product.course || 'N/A'}</p>
      <p><b>Verified:</b> {product.verified ? 'Yes' : 'No'}</p>
      <p><b>Returnable:</b> {product.returnable ? 'Yes' : 'No'}</p>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleAddToFavorites} style={styles.buttonSecondary}>Add to Favorites</button>
        <button onClick={() => handleAddToBasket(product.item_id)}>Add to Basket</button>
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
