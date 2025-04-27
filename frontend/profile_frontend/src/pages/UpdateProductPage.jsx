import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const UpdateProductPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/home/item/${itemId}`)
      .then(res => res.json())
      .then(data => setForm(data));
  }, [itemId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`http://127.0.0.1:8000/api/home/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert('Product updated successfully!');
      navigate(`/item/${itemId}`);
    } else {
      alert('Failed to update.');
    }
  };

  if (!form) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h2>Edit Product</h2>

      {[
        ['title', 'Title'],
        ['description', 'Description'],
        ['brand', 'Brand'],
        ['category', 'Category'],
        ['sub_category', 'Subcategory'],
        ['condition', 'Condition'],
        ['course', 'Course'],
        ['image', 'Image URL'],
      ].map(([field, label]) => (
        <div key={field} style={{ marginBottom: 10 }}>
          <label>{label}</label>
          <input
            type="text"
            name={field}
            value={form[field] || ''}
            onChange={handleChange}
            style={{ width: '100%' }}
          />
        </div>
      ))}

      <div style={{ marginBottom: 10 }}>
        <label>Price</label>
        <input type="number" name="price" value={form.price} onChange={handleChange} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Age</label>
        <input type="number" name="age" value={form.age} onChange={handleChange} style={{ width: '100%' }} />
      </div>

      {['dorm', 'verified', 'inStock', 'available_now', 'isSold', 'returnable'].map((field) => (
        <div key={field}>
          <label>
            <input type="checkbox" name={field} checked={form[field] || false} onChange={handleChange} />
            {' '}{field}
          </label>
        </div>
      ))}

      <button
        type="submit"
        style={{ marginTop: 20, background: 'green', color: 'white', padding: '10px 20px', borderRadius: 8 }}
      >
        Save Changes
      </button>
    </form>
  );
};

export default UpdateProductPage;
