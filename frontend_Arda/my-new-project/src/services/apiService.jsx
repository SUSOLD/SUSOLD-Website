import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8001/api', // ✅ your correct backend baseURL (port 8001)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- AUTH ---
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (formData) => api.post('/auth/token', formData),  // must send username/password as form data
};

// --- USER PROFILE ---
export const userAPI = {
  getUserData: () => api.get('/get-user-data'),
  getMyFavorites: () => api.get('/my_favorites'),
  getMyOfferings: () => api.get('/my_offerings'),
  updateUserInfo: (data) => api.put('/update_user_info', data),
};

// --- HOME PAGE & ITEMS ---
export const itemAPI = {
  getItems: () => api.get('/home/'),               // get all items
  getItemById: (itemId) => api.get(`/home/item/${itemId}`),
  getItemIdByTitle: (title) => api.get(`/home/title/${title}`),
  createItem: (itemData) => api.post('/home/', itemData),
  updateItem: (itemId, itemData) => api.put(`/home/${itemId}`, itemData),
  deleteItem: (itemId) => api.delete(`/home/${itemId}`),
};

// --- FAVORITES ---
export const favoritesAPI = {
  getFavorites: () => api.get('/favorites'),
  toggleFavorite: (itemId) => api.post(`/favorites/${itemId}`),
  removeFavorite: (itemId) => api.delete(`/favorites/${itemId}`),
};

// --- BASKET ---
export const basketAPI = {
  getBasket: () => api.get('/basket'),
  toggleBasketItem: (itemId) => api.post(`/basket/${itemId}`),
  removeBasketItem: (itemId) => api.delete(`/basket/${itemId}`),
};

export default api;
