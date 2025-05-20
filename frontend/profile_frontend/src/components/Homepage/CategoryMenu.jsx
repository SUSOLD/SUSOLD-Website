import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // React Router'ı import ediyoruz

const CategoryMenu = ({ 
  activeCategory, 
  setActiveCategory, 
  openSortFilter,
  categories,
  isManager,
  onAddCategory,
  refreshItems
}) => {
  const navigate = useNavigate(); // Navigation hook'unu ekledik
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim() && newCategoryName.length >= 2) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };
  
  // Ürün ekleme sayfasına yönlendirme fonksiyonu
  const handleAddProduct = (category) => {
    // URL parametre olarak kategori bilgisini gönder
    navigate(`/add-product?category=${encodeURIComponent(category)}`);
  };

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
                handleAddProduct(category); // Artık modal yerine ayrı bir sayfaya yönlendir
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
    marginBottom: '5px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginTop: '15px'
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
  }
};

export default CategoryMenu;