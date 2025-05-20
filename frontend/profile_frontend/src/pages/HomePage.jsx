import React, { useEffect, useState } from 'react';
import Navbar from '../components/Homepage/Navbar';
import CategoryMenu from '../components/Homepage/CategoryMenu';
import MainCarousel from '../components/Homepage/MainCarousel';
import TabMenu from '../components/Homepage/TabMenu';
import ProductList from '../components/Homepage/ProductList';
import { favoritesAPI } from '../services/apiService';
import StatsPanel from './StatsPanel';



const token = localStorage.getItem('accessToken');
const tokenType = localStorage.getItem('tokenType');
const authHeader = token && tokenType ? { Authorization: `${tokenType} ${token}` } : {};

const HomePage = ({
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  activeCategory,
  setActiveCategory,
  isLoggedIn
}) => {
  const [items, setItems] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [categories, setCategories] = useState(['All']);
  const [isManager, setIsManager] = useState(false);
  const [isSalesManager, setIsSalesManager] = useState(false);   
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  const conditionPriority = {
    "New": 4,
    "Like New": 3,
    "Very Good": 2,
    "Excellent": 5,
    "Poor": 1
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/categories');
      const data = await response.json();
      if (data.categories) {
        const allCategories = ['All', ...data.categories.filter(cat => cat !== 'All')];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const checkIfManager = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/is_manager', {
        headers: authHeader
      });
      const data = await response.json();
      setIsManager(data.is_manager);
    } catch (error) {
      console.error('Error checking manager status:', error);
    }
  };

  const checkIfSalesManager = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/is_sales_manager', {
        headers: authHeader
      });
      const data = await response.json();
      setIsSalesManager(data.is_sales_manager);
    } catch (error) {
      console.error('Error checking sales manager status:', error);
    }
  };


  const addNewCategory = async (categoryName) => {
    try {
      if (!token) {
        alert('You need to be logged in to add categories');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({ name: categoryName })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchCategories();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category');
    }
  };

  const fetchItems = async () => {
    let url = 'http://127.0.0.1:8000/api/home/?';

    if (sortBy && sortBy !== "popularity") url += `sort_by=${sortBy}&`;
    if (minPrice) url += `min_price=${minPrice}&`;
    if (maxPrice) url += `max_price=${maxPrice}&`;
    if (descriptionFilter) url += `description=${descriptionFilter}&`;

    try {
      const response = await fetch(url, { headers: authHeader });
      const data = await response.json();
      let fetchedItems = data.featured_products || [];

      // ✅ Mark isFavorite based on user's favoriteIds
      fetchedItems = fetchedItems.map(item => ({
        ...item,
        isFavorite: favoriteIds.includes(item.item_id)
      }));

      if (sortBy === "popularity") {
        fetchedItems.sort((a, b) =>
          (conditionPriority[b.condition] || 0) - (conditionPriority[a.condition] || 0)
        );
      }

      setItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [sortBy]);

  useEffect(() => {
    fetchCategories();
    if (isLoggedIn) {
      checkIfManager();
      checkIfSalesManager();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (!token) return;

        const data = await favoritesAPI.getFavorites();
        const favIds = data.favorites.map(item => item.item_id);
        setFavoriteIds(favIds);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };

    if (isLoggedIn) {
      fetchFavorites();
    }
  }, [isLoggedIn]);


  // 🔁 Mark favorite items after favorites fetched
  useEffect(() => {
    if (favoriteIds.length && items.length) {
      const updatedItems = items.map(item => ({
        ...item,
        isFavorite: favoriteIds.includes(item.item_id)
      }));
      setItems(updatedItems);
    }
  }, [favoriteIds]);

  let filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(item =>
    activeCategory === 'All' || item.category === activeCategory
  );

  if (activeTab === 'Favorites') {
    filteredItems = filteredItems.filter(item =>
      favoriteIds.includes(item.item_id)
    );
  }


  const styles = {
    modal: {
      position: 'fixed',
      top: '20%',
      left: '30%',
      backgroundColor: 'white',
      padding: '20px',
      border: '2px solid black',
      borderRadius: '10px',
      zIndex: 999,
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '12px',
      borderRadius: '8px',
      border: '1px solid black',
      color: 'black',
      backgroundColor: 'white',
    },
    button: {
      marginRight: '10px',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#007bff',
      color: 'white',
      cursor: 'pointer'
    }
  };

  return (
    <div>
      <Navbar setSearchTerm={setSearchTerm} isSalesManager={isSalesManager} setShowStatsPanel={setShowStatsPanel} />


      <CategoryMenu
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        openSortFilter={() => setShowSortFilter(true)}
        categories={categories}
        isManager={isManager}
        onAddCategory={addNewCategory}
        refreshItems={fetchItems} // Pass the fetchItems function for refreshing after adding a product
      />
      <MainCarousel />
      <TabMenu activeTab={activeTab} setActiveTab={setActiveTab} />
      <ProductList
        items={filteredItems}
        searchTerm={searchTerm}
        activeTab={activeTab}
        activeCategory={activeCategory}
        isLoggedIn={isLoggedIn}
      />

      {showStatsPanel && <StatsPanel onClose={() => setShowStatsPanel(false)} />}


      {showSortFilter && (
        <div style={styles.modal}>
          <h3>Sort & Filter</h3>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            style={styles.input}
          >
            <option value="">Sort By</option>
            <option value="price_asc">Price Low to High</option>
            <option value="price_desc">Price High to Low</option>
            <option value="popularity">Condition Quality (Best First)</option> 
            <option value="newest">Newest</option>
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Description keyword"
            value={descriptionFilter}
            onChange={e => setDescriptionFilter(e.target.value)}
            style={styles.input}
          />

          <div style={{ marginTop: '10px' }}>
            <button onClick={() => { fetchItems(); setShowSortFilter(false); }} style={styles.button}>
              Apply
            </button>
            <button onClick={() => setShowSortFilter(false)} style={styles.button}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;