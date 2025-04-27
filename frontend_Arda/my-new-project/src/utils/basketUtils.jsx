

// Add an item to localStorage basket
export const addToBasketLocal = (itemId) => {
    let basket = JSON.parse(localStorage.getItem('basket')) || [];
    if (!basket.includes(itemId)) {
      basket.push(itemId);
      localStorage.setItem('basket', JSON.stringify(basket));
    }
  };
  
  // Get basket from localStorage
  export const getBasketLocal = () => {
    return JSON.parse(localStorage.getItem('basket')) || [];
  };
  
  // Clear localStorage basket
  export const clearBasketLocal = () => {
    localStorage.removeItem('basket');
  };