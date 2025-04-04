import { useEffect, useState } from "react";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import CategoriesSection from "../components/CategoriesSection";

const HomePage = () => {
  const [homeData, setHomeData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState("shop"); // shop or sell

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/home/")
      .then((response) => response.json())
      .then((data) => setHomeData(data))
      .catch((error) => {
        console.error("Error fetching homepage data:", error);
        setHomeData({ featured_products: [] }); // empty fallback
      });
  }, []);

  const featured = homeData?.featured_products || [];

  const filteredProducts = featured.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header setMode={setMode} />
      <HeroSection mode={mode} />

      <div className="max-w-screen-xl mx-auto px-4">
        {mode === "shop" && (
          <>
            <CategoriesSection />
            <hr className="my-6 border-gray-300" />

            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 mb-8 p-3 border border-gray-300 rounded-lg"
            />

            <section className="py-8">
              <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <div
                      key={index}
                      className="border rounded-xl bg-white shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
                    >
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">
                          {product.title}
                        </h3>
                        <p className="text-gray-600 mb-1">${product.price}</p>
                        <span className="text-sm text-green-600">
                          {product.condition}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No matching products found.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
