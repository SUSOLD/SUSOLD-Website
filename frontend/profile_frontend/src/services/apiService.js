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