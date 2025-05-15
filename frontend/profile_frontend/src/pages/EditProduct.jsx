// frontend/pages/EditProduct.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Package } from 'lucide-react';
import { getProductById, updateProduct } from '../services/apiService';
import { useNavigate, useParams } from 'react-router-dom';

const EditProduct = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    sub_category: '',
    brand: '',
    price: '',
    condition: 'New',
    age: 0,
    course: '',
    dorm: false,
    verified: false,
    warranty_status: 'No Warranty',
    inStock: true,
    available_now: true,
    isSold: 'stillInStock',
    returnable: false,
    description: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setFetchLoading(true);
        const productData = await getProductById(productId);

        setFormData({
          ...formData,
          ...productData,
          isSold: typeof productData.isSold === 'boolean'
            ? (productData.isSold ? 'processing' : 'stillInStock')
            : (productData.isSold || 'stillInStock'),
        });

        if (productData.image) setPreviewImage(productData.image);
      } catch (error) {
        console.error('Error fetching product data:', error);
        alert('Failed to load product data. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    if (productId) {
      fetchProductData();
    }
  }, [productId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              (name === 'price' || name === 'age') ? Number(value) : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        age: Number(formData.age),
      };

      if (formData.image && typeof formData.image !== 'string') {
        productData.image = previewImage;
      }

      await updateProduct(productId, productData);
      alert('Product updated successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Product deleted successfully!');
        navigate('/');
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting product.');
    }
  };

  if (fetchLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/')} className="mb-4 text-blue-600 flex items-center">
        <ArrowLeft className="mr-2" /> Back
      </button>
      <h1 className="text-2xl font-bold text-blue-700 mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {previewImage && <img src={previewImage} alt="preview" className="w-32 h-32 object-contain mb-2" />}
        <input type="file" onChange={handleImageChange} accept="image/*" />
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Title" className="input" />
        <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" className="input" />
        <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="input" />
        <input name="sub_category" value={formData.sub_category} onChange={handleChange} placeholder="Sub-category" className="input" />
        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" className="input" />
        <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age (months)" className="input" />
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="input" />

        <label><input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} /> In Stock</label>
        <label><input type="checkbox" name="available_now" checked={formData.available_now} onChange={handleChange} /> Available Now</label>
        <label><input type="checkbox" name="returnable" checked={formData.returnable} onChange={handleChange} /> Returnable</label>
        <label><input type="checkbox" name="dorm" checked={formData.dorm} onChange={handleChange} /> Dorm Item</label>

        <select name="isSold" value={formData.isSold} onChange={handleChange} className="input">
          <option value="stillInStock">Still in Stock</option>
          <option value="processing">Processing</option>
          <option value="inTransit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>

        <select name="warranty_status" value={formData.warranty_status} onChange={handleChange} className="input">
          <option value="No Warranty">No Warranty</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
        </select>

        <div className="flex gap-4">
          <button
  type="submit"
  disabled={loading}
  className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-300 text-black cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
>
  {loading ? 'Updating...' : 'Update Product'}
</button>

<button
  type="button"
  disabled={loading}
  onClick={handleDeleteProduct}
  className={`px-4 py-2 rounded-md ml-2 ${loading ? 'bg-gray-300 text-black cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
>
  Delete Product
</button>

        </div>
      </form>
    </div>
  );
};

export default EditProduct;
