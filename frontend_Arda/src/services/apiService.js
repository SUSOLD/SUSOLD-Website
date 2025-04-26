import axios from 'axios';

// Create an axios instance with baseURL pointing to your backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Adjust the URL according to your backend setup
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions to interact with backend
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (userData) => api.put('/user/profile', userData),
  
};

export const itemAPI = {
  getItems: (category = 'All', searchTerm = '') => 
    api.get('/items', { params: { category, searchTerm } }), // Fetch items by category and search term
  getItemDetails: (itemId) => api.get(`/items/${itemId}`), // Fetch details for a specific item
  addItemToCart: (itemId) => api.post(`/items/${itemId}/add-to-cart`), // Add item to cart
  removeItemFromCart: (itemId) => api.delete(`/items/${itemId}/remove-from-cart`), // Remove item from cart
};

export const categoryAPI = {
  getCategories: () => api.get('/categories'), // Fetch available categories
};

export const cartAPI = {
  getCartItems: () => api.get('/cart'), // Get all items in the cart
  updateCartItem: (itemId, quantity) => 
    api.put(`/cart/${itemId}`, { quantity }), // Update item quantity in the cart
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`), // Remove item from cart
};

export default api;