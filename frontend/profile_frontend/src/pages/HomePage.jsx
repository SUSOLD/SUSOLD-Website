import React, { useEffect, useState } from 'react';
import Navbar from '../components/Homepage/Navbar';
import CategoryMenu from '../components/Homepage/CategoryMenu';
import MainCarousel from '../components/Homepage/MainCarousel';
import TabMenu from '../components/Homepage/TabMenu';
import ProductList from '../components/Homepage/ProductList';


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

const conditionPriority = {
    "New": 4,
    "Like New": 3,
    "Very Good": 2,
    "Excellent": 5,
    "Poor": 1
    };

  const fetchItems = () => {
    let url = 'http://127.0.0.1:8000/api/home/?';

    if (sortBy && sortBy !== "popularity") url += `sort_by=${sortBy}&`;
    if (minPrice) url += `min_price=${minPrice}&`;
    if (maxPrice) url += `max_price=${maxPrice}&`;
    if (descriptionFilter) url += `description=${descriptionFilter}&`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
       let fetchedItems = data.featured_products || [];

       if (sortBy === "popularity") {
         fetchedItems.sort((a, b) => 
           (conditionPriority[b.condition] || 0) - (conditionPriority[a.condition] || 0)
         );
       }

        setItems(fetchedItems);
      })
      .catch(error => console.error('Error fetching products:', error));
  };

  useEffect(() => {
    fetchItems();
  }, [sortBy]); // 👉 Important: Watch sortBy change to refetch/sort properly

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('http://127.0.0.1:8000/api/my_favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.favorites) {
          const favIds = data.favorites.map(item => item.item_id);
          setFavoriteIds(favIds);
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };

    if (isLoggedIn) {
      fetchFavorites();
    }
  }, [isLoggedIn]);

  // Filter Logic
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

  return (
    <div>
      <Navbar setSearchTerm={setSearchTerm} />
      <CategoryMenu
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        openSortFilter={() => setShowSortFilter(true)}
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



const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
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
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  buttonPrimary: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};



export default HomePage;