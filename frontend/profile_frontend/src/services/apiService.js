// frontend/services/apiService.js
import axios from 'axios';
import AuthService from './AuthService';

// Axios instance oluşturuyoruz
const api = axios.create({
  baseURL: 'http://localhost:8000/api',  // Backend base URL'in
});

// Her request öncesinde Authorization header ayarlıyoruz
api.interceptors.request.use(
  (config) => {
    const authHeader = AuthService.getAuthHeader();  // tokenı AuthService'den al
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export const getUserProfile = async () => {
  const [nameRes, photoRes, ratingRes, verifiedRes, isManagerRes, offeringsRes, feedbacksRes] = await Promise.all([
    api.get('/my_name'),
    api.get('/current_photo'),
    api.get('/current_rating'),
    api.get('/is_verified'),
    api.get('/is_manager'), // Yeni eklenen isManager sorgusu
    api.get('/my_offerings'),
    api.get('/my_feedbacks'),
  ]);

  return {
    name: nameRes.data.name,
    lastname: nameRes.data.lastname,
    photo: photoRes.data.photo_url,
    rating: ratingRes.data.current_rating,
    is_verified: verifiedRes.data.is_verified,
    isManager: isManagerRes.data.is_manager, // Yeni eklenen değer
    offerings: offeringsRes.data.offerings,
    feedbacksReceived: feedbacksRes.data.feedbacks_received
  };
};

export const removeProduct = async (productId) => {
  return await api.post('/remove_from_offerings', null, {
    params: { product_id: productId }
  });
};

export const addProduct = async (productData) => {
  // If we have an actual file, we need to use FormData
  if (productData.image instanceof File) {
    const formData = new FormData();
    
    // Add all other fields to the form data
    Object.keys(productData).forEach(key => {
      if (key !== 'image') {
        formData.append(key, productData[key]);
      }
    });
    
    // Add the image file last
    formData.append('image', productData.image);
    
    return await api.post('/home/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  } 
  // Otherwise, just send the data as JSON
  else {
    return await api.post('/home/', productData);
  }
};

export const updateProduct = async (productId, productData) => {
  // If we have an actual file, we need to use FormData
  if (productData.image instanceof File) {
    const formData = new FormData();
    
    // Add all other fields to the form data
    Object.keys(productData).forEach(key => {
      if (key !== 'image') {
        formData.append(key, productData[key]);
      }
    });
    
    // Add the image file last
    formData.append('image', productData.image);
    
    return await api.put(`/home/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  } 
  // Otherwise, just send the data as JSON
  else {
    return await api.put(`/home/${productId}`, productData);
  }
};

export const getFavorites = async () => {
  const res = await api.get('/my_favorites');
  return res.data.favorites;
};

export const removeFromFavorites = async (productId) => {
  return await api.post('/remove_from_favorites', null, {
    params: { product_id: productId }
  });
};

export const getProductById = async (item_id) => {
  const res = await api.get(`/home/item/${item_id}`);
  return res.data;
};

// Yeni eklenen fonksiyonlar - Yönetici özellikleri için

export const getUnapprovedComments = async () => {
  const res = await api.get('/unapproved_comments');
  return res.data.unapproved_comments;
};

export const approveComment = async (feedbackId) => {
  return await api.post(`/approve_comment/${feedbackId}`);
};

export const removeComment = async (feedbackId) => {
  return await api.delete(`/remove_comment/${feedbackId}`);
};
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
// Add an item to localStorage basket
export const addToBasketLocal = (itemId) => {
  let basket = JSON.parse(localStorage.getItem('basket')) || [];
  if (!basket.includes(itemId)) {
    basket.push(itemId);
    localStorage.setItem('basket', JSON.stringify(basket));
  }
};


export const checkItemInStock = async (itemId) => {
  const res = await api.get('/get_in_stock', {
    params: { item_id: itemId }
  });
  return res.data; // {"in_stock": true} gibi döner
};

// Get basket from localStorage
export const getBasketLocal = () => {
  return JSON.parse(localStorage.getItem('basket')) || [];
};

// Clear localStorage basket
export const clearBasketLocal = () => {
  localStorage.removeItem('basket');
};
