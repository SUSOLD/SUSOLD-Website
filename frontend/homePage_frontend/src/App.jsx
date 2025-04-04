// src/App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SellForm from "./pages/SellForm";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sell" element={<SellForm />} />
    </Routes>
  );
};

export default App;
