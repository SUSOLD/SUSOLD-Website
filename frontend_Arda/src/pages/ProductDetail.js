import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8001/api/home/item/${itemId}`)
      .then(res => res.json())
      .then(data => setProduct(data))
      .catch(err => console.error('Error loading product:', err));
  }, [itemId]);

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    const res = await fetch(`http://127.0.0.1:8001/api/home/${itemId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      alert('Product deleted!');
      navigate('/');
    } else {
      alert('Failed to delete product.');
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
      <p><b>Course item:</b> {product.course}</p>
      <p><b>Verified:</b> {product.verified ? 'Yes' : 'No'}</p>
      <p><b>Returnable:</b> {product.returnable ? 'Yes' : 'No'}</p>

      <button
        onClick={handleDelete}
        style={{
          marginTop: '20px',
          backgroundColor: 'red',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Delete Product
      </button>

      <button
        onClick={() => navigate(`/edit/${itemId}`)}
        style={{
          marginTop: '20px',
          backgroundColor: '#444',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginLeft: '10px'
        }}
      >
        Edit Product
      </button>
    </div>
  );
};

export default ProductDetail;
