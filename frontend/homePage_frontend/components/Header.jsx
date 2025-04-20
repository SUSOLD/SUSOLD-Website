import { FaUser, FaShoppingCart, FaBars } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState } from "react";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // You can implement the actual sidebar in future
    console.log("Toggle sidebar!");
  };

  return (
    <header className="bg-pink-100 text-gray-800 shadow-md">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="text-xl">
            <FaBars />
          </button>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="flex items-center gap-1 hover:underline">
            <FaUser className="text-lg" />
            <span>Login</span>
          </Link>
          <FaShoppingCart className="text-xl cursor-pointer" />
        </div>
      </div>
    </header>
  );
};

export default Header;
