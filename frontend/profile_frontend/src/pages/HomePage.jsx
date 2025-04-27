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

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/home/')
      .then(response => response.json())
      .then(data => setItems(data.featured_products || []))
      .catch(error => console.error('Error fetching products:', error));
  }, []);

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

  // -------------------------------------------
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

  // -------------------------------------------

  return (
    <div>
      <Navbar setSearchTerm={setSearchTerm} />
      <CategoryMenu
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
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
    </div>
  );
};

export default HomePage;