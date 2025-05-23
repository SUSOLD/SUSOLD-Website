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
    isSold: 'stillInStock', // Changed from boolean to string enum
    returnable: false,
    description: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setFetchLoading(true);
        const productData = await getProductById(productId);
        
        setFormData({
          title: productData.title || '',
          category: productData.category || '',
          sub_category: productData.sub_category || '',
          brand: productData.brand || '',
          price: productData.price || 0,
          condition: productData.condition || 'New',
          age: productData.age || 0,
          course: productData.course || '',
          dorm: productData.dorm || false,
          verified: productData.verified || false,
          warranty_status: productData.warranty_status || 'No Warranty',
          inStock: productData.inStock || true,
          available_now: productData.available_now || true,
          // Handle the case where isSold might still be a boolean in some stored items
          isSold: typeof productData.isSold === 'boolean' 
            ? (productData.isSold ? 'processing' : 'stillInStock')
            : (productData.isSold || 'stillInStock'),
          returnable: productData.returnable || false,
          description: productData.description || '',
          image: productData.image || null
        });
        
        if (productData.image) {
          setPreviewImage(productData.image);
        }
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
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
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

      // If there's a new image, convert it to base64 string
      if (formData.image && typeof formData.image !== 'string') {
        productData.image = previewImage;
      }

      const response = await updateProduct(productId, productData);
      console.log('Product updated successfully:', response);
      navigate('/profile'); // Redirect back to profile page
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg">Loading product data...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center">
          <button 
            onClick={() => navigate('/profile')} 
            className="mr-4 p-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-blue-600">Edit Product</h1>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex justify-center">
                <div className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center overflow-hidden relative">
                  {previewImage ? (
                    <img src={previewImage} alt="Product preview" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <Package size={48} className="text-gray-400 mb-2" />
                      <p className="text-gray-500 text-center">Upload product image</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand*</label>
                <input 
                  type="text" 
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Books">Books</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Sports">Sports</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                <input 
                  type="text" 
                  name="sub_category"
                  value={formData.sub_category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition*</label>
                <select 
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (months)*</label>
                <input 
                  type="number" 
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₺)*</label>
                <input 
                  type="number" 
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Course (if applicable)</label>
              <input 
                type="text" 
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* New Order Status Dropdown for Seller */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select 
                name="isSold"
                value={formData.isSold}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="stillInStock">Still In Stock</option>
                <option value="processing">Processing</option>
                <option value="inTransit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Status</label>
              <select 
                name="warranty_status"
                value={formData.warranty_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="No Warranty">No Warranty</option>
                <option value="Active">Active Warranty</option>
                <option value="Expired">Expired Warranty</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description* (max 200 chars)</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                maxLength="200"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="dorm"
                  name="dorm"
                  checked={formData.dorm}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="dorm" className="ml-2 block text-sm text-gray-700">Available in dorm</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="returnable"
                  name="returnable"
                  checked={formData.returnable}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="returnable" className="ml-2 block text-sm text-gray-700">Returnable</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="inStock"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">In Stock</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="available_now"
                  name="available_now"
                  checked={formData.available_now}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="available_now" className="ml-2 block text-sm text-gray-700">Available Now</label>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => navigate('/profile')}
                className="px-4 py-2 mr-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none flex items-center"
              >
                {loading ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProduct;