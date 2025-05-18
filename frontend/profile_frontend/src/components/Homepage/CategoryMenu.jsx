import React, { useState } from 'react';
import { addProduct } from '../../services/apiService'; // Make sure this path is correct
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this package

const CategoryMenu = ({ 
  activeCategory, 
  setActiveCategory, 
  openSortFilter,
  categories,
  isManager,
  onAddCategory,
  refreshItems
}) => {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // New state for Add Product modal
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Product form state
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    condition: 'New',
    image: null,
    item_id: uuidv4()
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleAddCategory = () => {
    if (newCategoryName.trim() && newCategoryName.length >= 2) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };
  
  // Handle opening the Add Product modal
  const handleAddProductClick = (category) => {
    setSelectedCategory(category);
    setProductForm({
      ...productForm,
      category: category,
      item_id: uuidv4() // Generate a new ID
    });
    setSubmitError('');
    setSubmitSuccess(false);
    setImagePreview(null);
    setShowAddProduct(true);
  };
  
  // Handle product form changes
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value
    });
  };
  
  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductForm({
        ...productForm,
        image: file
      });
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle adding product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Send product to API (price will default to 0 in backend)
      await addProduct({
        ...productForm,
        category: selectedCategory
      });
      
      setSubmitSuccess(true);
      
      // Close modal after 2 seconds and refresh items
      setTimeout(() => {
        setShowAddProduct(false);
        if (refreshItems) refreshItems();
      }, 2000);
    } catch (error) {
      console.error("Error adding product:", error);
      setSubmitError(error.response?.data?.detail || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Array of condition options for dropdown
  const conditionOptions = [
    'New',
    'Like New',
    'Very Good',
    'Good',
    'Acceptable',
    'Poor'
  ];

  return (
    <nav style={styles.menu}>
      {categories.map((category, index) => (
        <div 
          key={index} 
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <span
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
          
          {/* Add Product button (only for managers and non-All categories) */}
          {isManager && category !== 'All' && (
            <button 
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                cursor: 'pointer',
                zIndex: 5,
                opacity: 0,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0'}
              onClick={(e) => {
                e.stopPropagation(); // Prevent category selection
                handleAddProductClick(category);
              }}
              title={`Add product to ${category}`}
            >
              +
            </button>
          )}
        </div>
      ))}
      
      {isManager && (
        <span
          onClick={() => setShowAddCategory(true)}
          style={styles.addButton}
          title="Add new category"
        >
          +
        </span>
      )}

      <button onClick={openSortFilter} style={styles.sortButton}>
        Sort & Filter
      </button>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Add New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (2-30 characters)"
              style={styles.input}
              maxLength={30}
              autoFocus
            />
            <div style={styles.buttonContainer}>
              <button 
                onClick={handleAddCategory} 
                style={styles.buttonPrimary}
                disabled={newCategoryName.trim().length < 2}
              >
                Add
              </button>
              <button 
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }} 
                style={styles.buttonSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Product Modal */}
      {showAddProduct && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, width: '450px', maxWidth: '90vw'}}>
            <h3 style={{marginTop: 0}}>Add Product to {selectedCategory}</h3>
            
            {submitSuccess ? (
              <div style={styles.successContainer}>
                <div style={styles.successIcon}>✓</div>
                <p style={styles.successText}>Product added successfully!</p>
                <p style={{fontSize: '14px', color: '#666'}}>
                  Your product has been added and is awaiting price assignment from a Sales Manager.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddProduct}>
                {submitError && (
                  <div style={styles.errorMessage}>
                    {submitError}
                  </div>
                )}
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Title*</label>
                  <input
                    type="text"
                    name="title"
                    value={productForm.title}
                    onChange={handleProductFormChange}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description*</label>
                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={handleProductFormChange}
                    style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Condition*</label>
                  <select
                    name="condition"
                    value={productForm.condition}
                    onChange={handleProductFormChange}
                    style={styles.input}
                    required
                  >
                    {conditionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <input
                    type="text"
                    value={selectedCategory}
                    style={{...styles.input, backgroundColor: '#f0f0f0'}}
                    disabled
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Product Image</label>
                  {imagePreview ? (
                    <div style={styles.imagePreviewContainer}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={styles.imagePreview} 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setProductForm({...productForm, image: null});
                        }}
                        style={styles.removeImageButton}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={styles.imageUploadContainer}>
                      <input
                        type="file"
                        id="productImage"
                        onChange={handleImageChange}
                        style={styles.fileInput}
                        accept="image/*"
                      />
                      <label htmlFor="productImage" style={styles.fileInputLabel}>
                        Choose Image
                      </label>
                    </div>
                  )}
                </div>
                
                <div style={styles.buttonContainer}>
                  <button
                    type="submit"
                    style={{
                      ...styles.buttonPrimary, 
                      backgroundColor: '#007bff',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    style={styles.buttonSecondary}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const styles = {
  menu: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 10
  },
  item: {
    fontWeight: 'bold'
  },
  addButton: {
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#28a745',
    padding: '4px 12px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    minWidth: '30px',
    minHeight: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #28a745',
    transition: 'all 0.2s'
  },
  sortButton: {
    backgroundColor: '#f0f0f0',
    color: 'black',
    padding: '4px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid black'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    border: '2px solid black',
    borderRadius: '10px',
    minWidth: '300px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px'
  },
  buttonPrimary: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    flex: 1,
    fontSize: '14px'
  },
  buttonSecondary: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    flex: 1,
    fontSize: '14px'
  },
  // New styles for Add Product modal
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '15px',
    fontSize: '14px',
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successIcon: {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#28a745',
    color: 'white',
    fontSize: '24px',
    marginBottom: '15px',
  },
  successText: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '10px 0',
  },
  imageUploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '20px',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  fileInputLabel: {
    backgroundColor: '#f8f9fa',
    color: '#495057',
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  imagePreviewContainer: {
    position: 'relative',
    display: 'inline-block',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  removeImageButton: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    cursor: 'pointer',
  }
};

export default CategoryMenu;