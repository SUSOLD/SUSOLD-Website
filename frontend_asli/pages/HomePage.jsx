import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';  // Link'i import et
import Navbar from '../components/Navbar';
import CategoryMenu from '../components/CategoryMenu';
import MainCarousel from '../components/MainCarousel';
import TabMenu from '../components/TabMenu';
import ProductList from '../components/ProductList';

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

  useEffect(() => {
    // Backend'den veri çekiyoruz
    fetch('http://127.0.0.1:8000/api/home/')
      .then(response => response.json())
      .then(data => setItems(data.featured_products || []))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const filteredItems = items
    .filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => activeCategory === 'All' || item.category === activeCategory);

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