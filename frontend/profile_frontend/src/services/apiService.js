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
  const [nameRes, photoRes, ratingRes, verifiedRes, isManagerRes, isSalesManagerRes, offeringsRes, feedbacksRes] = await Promise.all([
    api.get('/my_name'),
    api.get('/current_photo'),
    api.get('/current_rating'),
    api.get('/is_verified'),
    api.get('/is_manager'),
    api.get('/is_sales_manager'), // Yeni eklenen sales manager sorgusu
    api.get('/my_offerings'),
    api.get('/my_feedbacks'),
  ]);

  return {
    name: nameRes.data.name,
    lastname: nameRes.data.lastname,
    photo: photoRes.data.photo_url,
    rating: ratingRes.data.current_rating,
    is_verified: verifiedRes.data.is_verified,
    isManager: isManagerRes.data.is_manager,
    isSalesManager: isSalesManagerRes.data.is_sales_manager, // Yeni eklenen değer
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
  // Make sure all required fields from ProductCreate model are included
  const requiredFields = [
    'title', 'category', 'brand', 'condition', 'age', 'description', 'item_id'
  ];
  
  // Check if all required fields are present
  for (const field of requiredFields) {
    if (!productData[field] && field !== 'price') {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Ensure price is set to 0
  const updatedProductData = {
    ...productData,
    price: 0
  };
  
  // If we have an actual file, we need to use FormData
  if (updatedProductData.image instanceof File) {
    const formData = new FormData();
    
    // Add all other fields to the form data
    Object.keys(updatedProductData).forEach(key => {
      if (key !== 'image') {
        // Handle boolean values
        if (typeof updatedProductData[key] === 'boolean') {
          formData.append(key, updatedProductData[key].toString());
        } else {
          formData.append(key, updatedProductData[key]);
        }
      }
    });
    
    // Add the image file last
    formData.append('image', updatedProductData.image);
    
    return await api.post('/home/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  } 
  // Otherwise, just send the data as JSON
  else {
    return await api.post('/home/', updatedProductData);
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

// Yönetici özellikleri için
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

// --- Yeni Eklenen API Fonksiyonları: Satın Alınan Ürünler ---

// Kullanıcının satın aldığı ürünleri getir
export const getPurchasedProducts = async () => {
  try {
    // /user-orders endpoint'ini kullan
    const res = await api.get('/user-orders');
    
    if (!res.data || res.data.length === 0) {
      return [];
    }
    
    const orderGroups = [];
    
    for (const order of res.data) {
      try {
        const orderItems = [];
        
        // Siparişteki her bir ürün ID'si için ürün bilgisini alalım
        for (const itemId of order.item_ids) {
          const product = await getProductById(itemId);
          if (product) {
            orderItems.push(product);
          }
        }
        
        // Backend'den gelen tüm bilgileri kullan
        orderGroups.push({
          order_id: order.order_id,
          purchase_date: order.date,
          status: order.status || 'processing',
          refund_status: order.refund_status || 'notSent',
          shipping_address: order.shipping_address || 'No address provided',
          number_of_items: order.number_of_items || orderItems.length,
          user_id: order.user_id,
          items: orderItems
        });
        
      } catch (error) {
        console.error(`Error processing order ${order.order_id}:`, error);
      }
    }
    
    return orderGroups;
  } catch (error) {
    console.error('Error fetching purchased products:', error);
    return [];
  }
};



// Tüm siparişleri getir (Product Manager için)
export const getAllOrders = async () => {
  const res = await api.get('/all-orders'); // Bu endpoint'i backend'de oluşturmanız gerekebilir
  return res.data || [];
};

// Ürün durumunu güncelle
export const updateProductStatus = async (itemId, status) => {
  try {
    const res = await api.put(`/mark_status/${itemId}?status=${status}`);
    return res.data;
  } catch (error) {
    console.error('Error updating product status:', error);
    throw error;
  }
};

// Bir ürünün işlemde olup olmadığını kontrol et
export const isItemProcessing = async (itemId) => {
  try {
    const res = await api.get('/is_processing', {
      params: { item_id: itemId }
    });
    return res.data; // Boolean değer döner (true/false)
  } catch (error) {
    console.error('Error checking if item is processing:', error);
    return false;
  }
};

// Siparişi iptal et
export const cancelOrder = async (orderId) => {
  return await api.post(`/cancel-order/${orderId}`);
};

// İade talebi gönder
export const submitRefundRequest = async (orderId, itemIds) => {
  return await api.post(`/refund-request/${orderId}`, { item_ids: itemIds });
};

// --- Satış Yöneticisi (Sales Manager) API Fonksiyonları ---

// İade taleplerini getir
export const getRefundRequests = async () => {
  const res = await api.get('/refund-requests');
  return res.data;
};

export const handleRefundAction = async (orderId, action) => {
  if (action !== 'approve' && action !== 'reject') {
    throw new Error('Invalid action. Must be "approve" or "reject"');
  }
  
  return await api.post(`/handle-refund-request/${orderId}`, {}, {
    params: { action }
  });
};

// Fiyatı olmayan ürünleri getir
export const getItemsWithoutPrice = async () => {
  const res = await api.get('/items-without-price');
  return res.data || { items_with_no_price: [] };
};

// Ürün fiyatını ayarla
export const setProductPrice = async (itemId, price) => {
  return await api.post(`/set-price/${itemId}`, null, {
    params: { price }
  });
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
  getFavorites: async () => {
    const res = await api.get('/favorites');
    return res.data; 
  }
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


export const salesAPI = {
  setDiscount: (itemId, rate) => api.post(`/home/set-discount/${itemId}`, null, { params: { discount_rate: rate } }),
  getSalesSummary: (start, end) => api.get(`/home/sales-summary`, { params: { start_date: start, end_date: end } })
};


