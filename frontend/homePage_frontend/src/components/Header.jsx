import { FaSearch, FaUser, FaHeart, FaShoppingCart } from "react-icons/fa";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
      <h1 className="text-2xl font-bold text-gray-800">SUSOLD</h1>

      <nav className="flex gap-6 text-lg text-blue-700 font-medium">
        <Link to="/" className="hover:underline">Shop</Link>
        <Link to="/sell" className="hover:underline">Sell</Link>
      </nav>

      <div className="flex gap-4 text-gray-700">
        <FaSearch className="text-xl cursor-pointer" />
        <FaUser className="text-xl cursor-pointer" />
        <FaHeart className="text-xl cursor-pointer" />
        <FaShoppingCart className="text-xl cursor-pointer" />
      </div>
    </header>
  );
};

export default Header;
