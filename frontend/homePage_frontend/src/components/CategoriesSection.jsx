const CategoriesSection = () => {
    const categories = ["Books", "Electronics", "Dorm Items", "Clothing", "Course Tools"];
  
    return (
      <section className="p-8">
        <h3 className="text-2xl font-bold mb-6">Browse by Category</h3>
        <div className="flex flex-wrap gap-4">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className="px-6 py-3 bg-gray-100 rounded-full hover:bg-green-100 transition"
            >
              {cat}
            </button>
          ))}
        </div>
      </section>
    );
  };
  
  export default CategoriesSection;
  