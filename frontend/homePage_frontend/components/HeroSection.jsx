const HeroSection = ({ mode }) => {
  const isShop = mode === "shop";

  return (
    <section className="bg-pink-100 py-10 px-4 md:px-16 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
        {isShop ? "SUSOLD" : "Sell and buy anything you want"}
      </h2>
      <p className="text-gray-700 mb-2 text-lg">
        {isShop
          ? "Thrift and sell campus items"
          : "Make extra money by selling unused stuff to your campus."}
      </p>
    </section>
  );
};

export default HeroSection;
