import { useEffect, useState } from "react";
import { FaHeart, FaShoppingCart, FaSlidersH } from "react-icons/fa";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import SortFilterSidebar from "../components/sortFilderSidebar";

const HomePage = () => {
  const [homeData, setHomeData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("shop");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [basket, setBasket] = useState([]);

  // Fetch products and user lists
  useEffect(() => {
    const queryParams = new URLSearchParams(filters).toString();

    fetch(`http://127.0.0.1:8000/api/home/?${queryParams}`)
      .then((res) => res.json())
      .then((data) => setHomeData(data))
      .catch(() => setHomeData({ featured_products: [] }));

    fetch("http://127.0.0.1:8000/api/user/favorites")
      .then((res) => res.json())
      .then((data) => setFavorites(data.favorites || []));

    fetch("http://127.0.0.1:8000/api/user/basket")
      .then((res) => res.json())
      .then((data) => setBasket(data.basket || []));
  }, [filters]);

  const toggleFavorite = (id) => {
    fetch(`http://127.0.0.1:8000/api/user/favorites/${id}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => setFavorites(data.favorites));
  };

  const toggleBasket = (id) => {
    fetch(`http://127.0.0.1:8000/api/user/basket/${id}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => setBasket(data.basket));
  };

  const featured = homeData?.featured_products || [];

  const filteredProducts = featured.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-pink-100 min-h-screen">
      <Header setMode={setMode} />
      <HeroSection mode={mode} />

      <div className="max-w-screen-xl mx-auto px-4 mt-6">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg shadow"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/5 hidden md:block">
            <div className="bg-pink-200 rounded-lg p-4 shadow">
              <p className="font-semibold text-lg mb-2">👤 User Profile</p>
              <p>arda.taskoparan ⭐ 3.5</p>
              <button className="mt-4">+ Add Item</button>   // Fetch products and user lists
              
            </div>
          </div>

          {/* Product Grid */}
          <div className="w-full md:w-3/5">
            <h2 className="text-2xl font-bold mb-4">Featured Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-center">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-3 flex flex-col items-center"
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />
                    <div className="text-center">
                      <h3 className="text-md font-semibold">{product.title}</h3>
                      <p className="text-sm text-gray-600">{product.condition}</p>
                      <p className="font-bold">{product.price} TL</p>
                      <p className="text-xs text-gray-500">
                        Likes: {product.likes || 0}
                      </p>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <FaHeart
                        className={`cursor-pointer text-xl ${
                          favorites.includes(product.item_id)
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                        onClick={() => toggleFavorite(product.item_id)}
                      />
                      <FaShoppingCart
                        className={`cursor-pointer text-xl ${
                          basket.includes(product.item_id)
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                        onClick={() => toggleBasket(product.item_id)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p>No products match your search.</p>
              )}
            </div>
          </div>

          {/* Filter Sidebar Toggle */}
          <div className="w-full md:w-1/5">
            <div
              className="flex justify-between items-center mb-3 cursor-pointer"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="font-semibold text-lg">FILTER & SORT</span>
              <FaSlidersH />
            </div>
            {showFilters && (
              <SortFilterSidebar filters={filters} setFilters={setFilters} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
