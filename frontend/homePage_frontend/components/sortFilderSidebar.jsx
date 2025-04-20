import { useEffect, useState } from "react";

const SortFilterSidebar = ({ filters = {}, setFilters }) => {
  const categoryMap = {
    Dormitory: ["Bedding", "Furniture"],
    Books: ["CS", "Math", "History"],
    Clothing: ["Topwear", "Bottomwear"],
    Electronics: ["Laptop", "Appliance"],
  };

  const brandMap = {
    Bedding: ["Ikea", "Yataş"],
    Furniture: ["Ikea", "Bellona"],
    CS: ["Nobel", "Cambridge"],
    Math: ["Pearson", "McGraw-Hill"],
    Topwear: ["Zara", "LC Waikiki"],
    Laptop: ["HP", "Dell"],
  };

  const selectedSubcategories = filters.category ? categoryMap[filters.category] || [] : [];
  const selectedBrands = filters.subcategory ? brandMap[filters.subcategory] || [] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" && { subcategory: "", brand: "" }),
      ...(name === "subcategory" && { brand: "" }),
    }));
  };

  const handleBooleanChange = (e) => {
    const { name, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <aside className="w-full md:w-64 p-4 bg-white border rounded shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Filter & Sort</h3>

      {/* Category */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Category</label>
        <select
          name="category"
          value={filters.category || ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Category</option>
          {Object.keys(categoryMap).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      {selectedSubcategories.length > 0 && (
        <div className="mb-4">
          <label className="block mb-1 font-medium">Subcategory</label>
          <select
            name="subcategory"
            value={filters.subcategory || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Subcategory</option>
            {selectedSubcategories.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      )}

      {/* Brand */}
      {selectedBrands.length > 0 && (
        <div className="mb-4">
          <label className="block mb-1 font-medium">Brand</label>
          <select
            name="brand"
            value={filters.brand || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Brand</option>
            {selectedBrands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sort */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Sort By</label>
        <select
          name="sort_by"
          value={filters.sort_by || ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">Select</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="popularity">Popularity</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Condition */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Condition</label>
        <select
          name="condition"
          value={filters.condition || ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">All</option>
          <option value="Very Good">Very Good</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Bad">Bad</option>
        </select>
      </div>

      {/* Age */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Age</label>
        <select
          name="age"
          value={filters.age || ""}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">All</option>
          <option value="<= 6 mth">≤ 6 months</option>
          <option value="6 mth - 1 yr">6 months - 1 year</option>
          <option value="1-2 years">1-2 years</option>
          <option value="> 2 years">2+ years</option>
        </select>
      </div>

      {/* Booleans */}
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="returnable" checked={filters.returnable || false} onChange={handleBooleanChange} />
          Returnable
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="available_now" checked={filters.available_now || false} onChange={handleBooleanChange} />
          Available Now
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="verified" checked={filters.verified || false} onChange={handleBooleanChange} />
          Verified Seller
        </label>
      </div>
    </aside>
  );
};

export default SortFilterSidebar;
