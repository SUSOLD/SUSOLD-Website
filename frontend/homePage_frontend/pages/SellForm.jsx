import { useState } from "react";

const SellForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    condition: "",
    age: "",
    warranty_status: false,
    warranty_expiry: "",
    address: "",
    dorm: false,
    course: false,
    isSold: false,
    pickup_method: "",
    delivery_cost: "",
    seller_verified: false,
    images: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleImageAdd = (e) => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, e.target.value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Parse delivery_cost and price to float
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      delivery_cost: parseFloat(formData.delivery_cost),
      images: formData.images.filter(Boolean),
      warranty_expiry: formData.warranty_expiry || null
    };

    const response = await fetch("http://127.0.0.1:8000/api/home/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Product listed successfully!");
    } else {
      alert("Error adding product.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded mt-6">
      <h2 className="text-2xl font-bold mb-4">Sell an Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <input type="text" name="title" placeholder="Title" className="w-full p-2 border" onChange={handleChange} required />
        <textarea name="description" placeholder="Description" className="w-full p-2 border" onChange={handleChange} />

        <input type="text" name="category" placeholder="Category" className="w-full p-2 border" onChange={handleChange} required />
        <input type="text" name="subcategory" placeholder="Subcategory" className="w-full p-2 border" onChange={handleChange} />
        
        <input type="number" name="price" placeholder="Price" className="w-full p-2 border" onChange={handleChange} required />
        <input type="text" name="condition" placeholder="Condition" className="w-full p-2 border" onChange={handleChange} required />
        <input type="text" name="age" placeholder="Age (e.g., 1-2 years)" className="w-full p-2 border" onChange={handleChange} />

        <input type="text" name="pickup_method" placeholder="Pickup Method" className="w-full p-2 border" onChange={handleChange} required />
        <input type="number" name="delivery_cost" placeholder="Delivery Cost" className="w-full p-2 border" onChange={handleChange} />

        <input type="text" placeholder="Image URL" className="w-full p-2 border" onBlur={handleImageAdd} />

        <input type="text" name="address" placeholder="Address (optional)" className="w-full p-2 border" onChange={handleChange} />
        <input type="date" name="warranty_expiry" className="w-full p-2 border" onChange={handleChange} />

        <label><input type="checkbox" name="warranty_status" onChange={handleChange} /> Warranty?</label>
        <label><input type="checkbox" name="dorm" onChange={handleChange} /> Dorm Item?</label>
        <label><input type="checkbox" name="course" onChange={handleChange} /> Course Related?</label>
        <label><input type="checkbox" name="seller_verified" onChange={handleChange} /> Verified Seller?</label>

        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Submit</button>
      </form>
    </div>
  );
};

export default SellForm;
