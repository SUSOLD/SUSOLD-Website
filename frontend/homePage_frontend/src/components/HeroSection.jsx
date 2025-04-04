// src/components/HeroSection.jsx
const HeroSection = ({ mode }) => {
  const isShop = mode === "shop";

  return (
    <section
      className="relative bg-cover bg-center h-[500px] flex items-center justify-center"
      style={{ backgroundImage: "url('/hero-image.jpg')" }}
    >
      <div className="bg-black bg-opacity-60 p-10 rounded-lg text-white text-center max-w-xl">
        <h2 className="text-4xl font-bold mb-4">
          {isShop ? "Dress it up your way" : "Sell anything you want"}
        </h2>
        <p className="text-lg">
          {isShop
            ? "Thrift campus items — up to 90% off retail prices"
            : "Make extra money by selling unused stuff to your campus."}
        </p>
        <button className="mt-6 px-6 py-2 bg-green-500 rounded-full text-white font-semibold hover:bg-green-600 transition">
          {isShop ? "Shop Now" : "Start Selling"}
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
