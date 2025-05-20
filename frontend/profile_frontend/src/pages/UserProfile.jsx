import React, { useState, useEffect } from 'react';
import { Star, Edit, Package, MessageSquare, Check, X, Plus, LogOut, AlertTriangle, ThumbsUp, ShoppingBag, RefreshCw, Truck, Map } from 'lucide-react';
import { 
  getUserProfile, 
  removeProduct, 
  getProductById, 
  getUnapprovedComments, 
  approveComment, 
  removeComment,
  getPurchasedProducts,
  isItemProcessing,
  cancelOrder,
  submitRefundRequest,
  getRefundRequests,
  handleRefundAction,
  getItemsWithoutPrice,
  setProductPrice,
  getAllOrders,
  updateProductStatus
} from '../services/apiService';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

const UserProfile = () => {
  const [userData, setUserData] = useState({
    name: '',
    lastname: '',
    profileImage: null,
    rating: 0,
    is_verified: false,
    isManager: false, // Yeni eklenen özellik
    offerings: [],
    comments: [],
    isSalesManager: false // Yeni eklenen Sales Manager rolü
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('offerings');
  const [unapprovedComments, setUnapprovedComments] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const navigate = useNavigate();
  // Satın alınan ürünler ve siparişler için yeni state değişkenleri
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [purchasedItemsLoading, setPurchasedItemsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({});

  // Sales Manager özelliği için yeni state değişkenleri
  const [refundRequests, setRefundRequests] = useState([]);
  const [refundRequestLoading, setRefundRequestLoading] = useState(false);
  const [itemsWithoutPrice, setItemsWithoutPrice] = useState([]);
  const [newPrice, setNewPrice] = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile();
        console.log('User Profile Data:', profileData);
  
        let offeringProducts = [];
        if (profileData.offerings && profileData.offerings.length > 0) {
          offeringProducts = await Promise.all(
            profileData.offerings.map(async (offering) => {
              try {
                const product = await getProductById(offering.item_id);
                return product;
              } catch (error) {
                console.error(`Error fetching product with ID ${offering.item_id}:`, error);
                return null;
              }
            })
          );
          offeringProducts = offeringProducts.filter(p => p !== null); // Filter out failed fetches
        }
  
        const transformedData = {
          name: `${profileData.name} ${profileData.lastname}`,
          profileImage: profileData.photo?.[0] || null,
          rating: profileData.rating,
          is_verified: profileData.is_verified,
          isManager: profileData.isManager,
          isSalesManager: profileData.isSalesManager, // Yeni eklenen değer 
          offerings: offeringProducts,
          comments: profileData.feedbacksReceived?.map(fb => ({
            id: fb._id,
            user: fb.sender_id,
            rating: fb.rating,
            comment: fb.comment,
          })) || []
        };
  
        setUserData(transformedData);
        
        // Yönetici ise onaylanmamış yorumları da yükle
        if (profileData.isManager) {
          fetchUnapprovedComments();
        }
        
        // Sales Manager içeriğini yükle
        if (profileData.isSalesManager) {
          fetchRefundRequests();
          fetchItemsWithoutPrice();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, []);
  
  // Onaylanmamış yorumları getir
  const fetchUnapprovedComments = async () => {
    try {
      const comments = await getUnapprovedComments();
      setUnapprovedComments(comments);
    } catch (error) {
      console.error('Error fetching unapproved comments:', error);
    }
  };
  
  // Yorum onaylama işlemi
  const handleApproveComment = async (feedbackId) => {
    try {
      setApprovalLoading(true);
      await approveComment(feedbackId);
      // Onaylanan yorumu listeden kaldır
      setUnapprovedComments(prev => prev.filter(comment => comment._id !== feedbackId));
    } catch (error) {
      console.error('Error approving comment:', error);
    } finally {
      setApprovalLoading(false);
    }
  };
  
  // Yorum silme işlemi
  const handleRemoveComment = async (feedbackId) => {
    try {
      setApprovalLoading(true);
      await removeComment(feedbackId);
      // Silinen yorumu listeden kaldır
      setUnapprovedComments(prev => prev.filter(comment => comment._id !== feedbackId));
    } catch (error) {
      console.error('Error removing comment:', error);
    } finally {
      setApprovalLoading(false);
    }
  };
  // Product Manager için tüm siparişleri yükle
  const fetchAllOrders = async () => {
    try {
      setOrderLoading(true);
      const orders = await getAllOrders();
      setAllOrders(orders);
    } catch (error) {
      console.error('Error fetching all orders:', error);
    } finally {
      setOrderLoading(false);
    }
  };
  // Ürün durumunu güncelle
  const handleStatusUpdate = async (itemId, newStatus) => {
    try {
      await updateProductStatus(itemId, newStatus);
      
      // Yerel state'i güncelle
      setAllOrders(prevOrders => 
        prevOrders.map(order => ({
          ...order,
          items: order.items.map(item => 
            item.item_id === itemId 
              ? { ...item, status: newStatus } 
              : item
          )
        }))
      );
      
      alert(`Product status updated to "${newStatus}" successfully.`);
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update status: ' + error.response?.data?.detail || error.message);
    }
  };

  // Navigate to Add Product page
  const handleAddProduct = () => {
    navigate('/add-product');
  };

  // Navigate to Edit Product page
  const handleEditProduct = (productId) => {
    navigate(`/edit-product/${productId}`);
  };

  const handleRemoveProduct = async (productId) => {
    try {
      await removeProduct(productId);
      setUserData(prev => ({
        ...prev,
        offerings: prev.offerings.filter(item => item.item_id !== productId)
      }));
    } catch (error) {
      console.error('Error removing product:', error);
    }
  };
  
  const handleLogout = () => {
    console.log('Logging out...');
    AuthService.logout();  // Clear token from localStorage
    navigate('/login');    // Redirect to login page
  };
  useEffect(() => {
    if (activeTab === 'purchases') {
      fetchPurchasedProducts();
    }
  }, [activeTab]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} fill={i < rating ? '#FFD700' : 'none'} color={i < rating ? '#FFD700' : '#D1D5DB'} />
    ));
  };
// Satın alınan ürünleri getir
const fetchPurchasedProducts = async () => {
  try {
    setPurchasedItemsLoading(true);
    const orders = await getPurchasedProducts();
    
    const orderMap = {};
    
    orders.forEach(order => {
      let totalPrice = 0;
      
      // Siparişteki tüm ürünlerin toplam fiyatını hesapla
      order.items.forEach(item => {
        totalPrice += item.price || 0;
      });
      
      orderMap[order.order_id] = {
        items: order.items,
        date: order.purchase_date,
        status: order.status, // Backend'den gelen sipariş durumunu kullan
        refund_status: order.refund_status, // Backend'den gelen refund durumunu kullan
        shipping_address: order.shipping_address, // Kargo adresi
        number_of_items: order.number_of_items, // Ürün sayısı
        user_id: order.user_id, // Kullanıcı ID'si
        total_price: totalPrice
      };
    });
    
    setOrderDetails(orderMap);
  } catch (error) {
    console.error('Error fetching purchased products:', error);
  } finally {
    setPurchasedItemsLoading(false);
  }
};
// Sipariş iptali
const handleCancelOrder = async (orderId) => {
  try {
    await cancelOrder(orderId);
    
    // Yerel state'i güncelle
    setOrderDetails(prev => {
      const updated = {...prev};
      if (updated[orderId]) {
        delete updated[orderId];
      }
      return updated;
    });
    
    alert('Order cancelled successfully');
  } catch (error) {
    console.error('Error cancelling order:', error);
    alert('Failed to cancel order: ' + error.response?.data?.detail || error.message);
  }
};

// İade talebi
const handleRefundRequest = async (orderId, itemIds) => {
  try {
    await submitRefundRequest(orderId, itemIds);
    
    // Sipariş durumunu yerel olarak güncelle
    setOrderDetails(prev => {
      const updated = {...prev};
      if (updated[orderId]) {
        updated[orderId].refundRequested = true;
      }
      return updated;
    });
    
    alert('Refund request submitted successfully');
  } catch (error) {
    console.error('Error requesting refund:', error);
    alert('Failed to submit refund request: ' + error.response?.data?.detail || error.message);
  }
};

// İade taleplerini getir (Sales Manager için)
const fetchRefundRequests = async () => {
  try {
    setRefundRequestLoading(true);
    const requests = await getRefundRequests();
    setRefundRequests(requests);
  } catch (error) {
    console.error('Error fetching refund requests:', error);
  } finally {
    setRefundRequestLoading(false);
  }
};

// İade talebini işle (onaylama/reddetme)
const processRefundRequest = async (orderId, action) => {
  try {
    setRefundRequestLoading(true);
    await handleRefundAction(orderId, action);
    
    // Yerel state'i güncelle
    setRefundRequests(prev => prev.filter(req => req.order_id !== orderId));
    
    alert(`Refund request ${action}d successfully`);
  } catch (error) {
    console.error(`Error ${action}ing refund request:`, error);
    alert(`Failed to ${action} refund: ` + error.response?.data?.detail || error.message);
  } finally {
    setRefundRequestLoading(false);
  }
};

// Fiyatı olmayan ürünleri getir (Sales Manager için)
// Fiyatı olmayan ürünleri getir (Sales Manager için)
const fetchItemsWithoutPrice = async () => {
  try {
    setPriceLoading(true);
    const items = await getItemsWithoutPrice();
    setItemsWithoutPrice(items.items_with_no_price || []);
  } catch (error) {
    console.error('Error fetching items without price:', error);
  } finally {
    setPriceLoading(false);
  }
};

// Ürün fiyatını ayarla
const handleSetPrice = async (itemId) => {
  try {
    setPriceLoading(true);
    const price = parseFloat(newPrice[itemId]);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    await setProductPrice(itemId, price);
    
    // Yerel state'i güncelle
    setItemsWithoutPrice(prev => prev.filter(id => id !== itemId));
    setNewPrice(prev => {
      const updated = {...prev};
      delete updated[itemId];
      return updated;
    });
    
    alert('Price set successfully');
  } catch (error) {
    console.error('Error setting price:', error);
    alert('Failed to set price: ' + error.response?.data?.detail || error.message);
  } finally {
    setPriceLoading(false);
  }
};


  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg">Loading...</p></div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'offerings':
        return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">My Products</h2>
              <button 
                onClick={handleAddProduct} 
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition"
              >
                <Plus size={18} className="mr-1" />
                Add Product
              </button>
            </div>
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.offerings.length > 0 ? (
                userData.offerings.map((product) => (
                  <div key={product.item_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-40 bg-gray-200 relative">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                      )}
                      
                      {/* Action buttons overlay */}
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button 
                          onClick={() => handleEditProduct(product.item_id)}
                          className="bg-blue-500 text-red p-1 rounded-full hover:bg-blue-600"
                          title="Edit Product"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleRemoveProduct(product.item_id)}
                          className="bg-red-500 text-red p-1 rounded-full hover:bg-red-600"
                          title="Remove Product"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800">{product.title}</h3>
                      <p className="text-blue-600 font-medium mt-1">{product.price} ₺</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                  <Package size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No products added yet.</p>
                </div>
              )}
            </div>
          </>
        );
    
      case 'comments':
        return (
          <div className="grid grid-cols-1 gap-4">
            {userData.comments.length > 0 ? (
              userData.comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center mb-2">
                    {renderStars(comment.rating)}
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                <MessageSquare size={40} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No comments yet.</p>
              </div>
            )}
          </div>
        );
        case 'comments':
          return (
            <div className="grid grid-cols-1 gap-4">
              {userData.comments.length > 0 ? (
                userData.comments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center mb-2">
                      {renderStars(comment.rating)}
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                  <MessageSquare size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No comments yet.</p>
                </div>
              )}
            </div>
          );
          
        case 'unapprovedComments':
          return (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Comments Awaiting Approval</h2>
              </div>
              
              {unapprovedComments.length > 0 ? (
                unapprovedComments.map((comment) => (
                  <div key={comment._id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {comment.rating && renderStars(comment.rating)}
                        {!comment.rating && <span className="text-gray-500 text-sm">No rating</span>}
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleApproveComment(comment._id)}
                          disabled={approvalLoading}
                          className="bg-green-100 text-green-700 p-2 rounded-md hover:bg-green-200 transition flex items-center"
                        >
                          <ThumbsUp size={16} className="mr-1" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRemoveComment(comment._id)}
                          disabled={approvalLoading}
                          className="bg-red-100 text-red-700 p-2 rounded-md hover:bg-red-200 transition flex items-center"
                        >
                          <X size={16} className="mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-700">{comment.comment}</p>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>From user: {comment.sender_id}</p>
                      <p>To user: {comment.receiver_id}</p>
                      {comment.item && <p>Product: {comment.item}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                  <AlertTriangle size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No comments awaiting approval.</p>
                </div>
              )}
            </div>
          );
        case 'purchases':
          return (
            <div className="grid grid-cols-1 gap-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">My Purchases</h2>
              </div>
              
              {purchasedItemsLoading ? (
                <div className="text-center py-10">
                  <RefreshCw size={40} className="text-blue-500 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-500">Loading your purchases...</p>
                </div>
              ) : Object.keys(orderDetails).length > 0 ? (
                Object.entries(orderDetails).map(([orderId, order]) => (
                  <div key={orderId} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">Order #{orderId.substring(0, 8)}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Placed on {new Date(order.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            User ID: {order.user_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total Items: {order.number_of_items}
                          </p>
                          
                          {/* Shipping Address */}
                          <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                            <p className="text-sm font-medium text-gray-800">Shipping Address:</p>
                            <p className="text-sm text-gray-600">{order.shipping_address}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex items-center">
                          <span 
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                              ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                                order.status === 'inTransit' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'}`}
                          >
                            {order.status === 'processing' ? <RefreshCw size={14} className="mr-1" /> : 
                              order.status === 'inTransit' ? <Truck size={14} className="mr-1" /> : 
                              <Check size={14} className="mr-1" />}
                            {order.status === 'processing' ? 'Processing' : 
                              order.status === 'inTransit' ? 'In Transit' : 'Delivered'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 py-4">
                      <ul className="divide-y divide-gray-200">
                        {order.items.map((item) => (
                          <li key={item.item_id} className="py-4 flex">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                                  <Package size={24} />
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>{item.title}</h3>
                                  <p className="ml-4">{item.price} ₺</p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">Category: {item.category}</p>
                                <p className="mt-1 text-sm text-gray-500">Product ID: {item.item_id}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Total</p>
                        <p>{order.total_price.toFixed(2)} ₺</p>
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleCancelOrder(orderId)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <X size={16} className="mr-1" />
                            Cancel Order
                          </button>
                        )}
                        
                        {order.status === 'delivered' && order.refund_status === 'notSent' && (
                          <button
                            onClick={() => {
                              // item_id'leri doğru şekilde toplayalım
                              const itemIds = order.items.map(item => item.item_id);
                              console.log('Items to refund:', itemIds);
                              handleRefundRequest(orderId, itemIds);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <RefreshCw size={16} className="mr-1" />
                            Request Refund
                          </button>
                        )}
                        
                        {order.refund_status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <RefreshCw size={14} className="mr-1" />
                            Refund Requested
                          </span>
                        )}
                        
                        {order.refund_status === 'approved' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <Check size={14} className="mr-1" />
                            Refund Approved
                          </span>
                        )}
                        
                        {order.refund_status === 'rejected' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <X size={14} className="mr-1" />
                            Refund Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                  <ShoppingBag size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No purchases yet.</p>
                </div>
              )}
            </div>
          );
          case 'refundRequests':
            return (
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Refund Requests</h2>
                </div>
                
                {refundRequestLoading ? (
                  <div className="text-center py-10">
                    <RefreshCw size={40} className="text-blue-500 mx-auto mb-3 animate-spin" />
                    <p className="text-gray-500">Loading refund requests...</p>
                  </div>
                ) : refundRequests.length > 0 ? (
                  refundRequests.map((request) => (
                    <div key={request.refund_id} className="bg-white rounded-lg shadow-md p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Refund Request #{request.order_id.substring(0, 8)}</h3>
                          <p className="text-sm text-gray-500 mt-1">User ID: {request.user_id}</p>
                        </div>
                        <p className="font-medium text-blue-600 mt-2 md:mt-0">
                          Refund Amount: {request.refund_amount.toFixed(2)} ₺
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                        <div className="space-y-4">
                          {request.items.map((item) => (
                            <div key={item.item_id} className="flex items-center p-2 bg-gray-50 rounded-md">
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 mr-4">
                                {item.image ? (
                                  <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" />
                                ) : (
                                  <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                                    <Package size={24} />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col flex-1">
                                <h5 className="text-sm font-medium text-gray-900">{item.title}</h5>
                                <p className="text-xs text-gray-500">{item.category}</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">{item.price} ₺</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => processRefundRequest(request.order_id, 'approve')}
                          disabled={refundRequestLoading}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Check size={16} className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => processRefundRequest(request.order_id, 'reject')}
                          disabled={refundRequestLoading}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <X size={16} className="mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                    <AlertTriangle size={40} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No refund requests pending.</p>
                  </div>
                )}
              </div>
            );
            case 'manageOrders':
              return (
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Manage Orders</h2>
                  </div>
                  
                  {orderLoading ? (
                    <div className="text-center py-10">
                      <RefreshCw size={40} className="text-blue-500 mx-auto mb-3 animate-spin" />
                      <p className="text-gray-500">Loading orders...</p>
                    </div>
                  ) : allOrders.length > 0 ? (
                    allOrders.map((order) => (
                      <div key={order.order_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Order #{order.order_id.substring(0, 8)}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                User ID: {order.user_id}
                              </p>
                              <p className="text-sm text-gray-500">
                                Placed on {new Date(order.date).toLocaleDateString()}
                              </p>
                              {/* Shipping Address bilgisini gösteriyoruz */}
                              <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                                <p className="text-sm font-medium text-gray-800">Shipping Address:</p>
                                <p className="text-sm text-gray-600">{order.shipping_address || "No address provided"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-6 py-4">
                          <ul className="divide-y divide-gray-200">
                            {order.items.map((item) => (
                              <li key={item.item_id} className="py-4 flex flex-col md:flex-row md:items-center">
                                <div className="flex-1 flex">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    {item.image ? (
                                      <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" />
                                    ) : (
                                      <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                                        <Package size={24} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>{item.title}</h3>
                                        <p className="ml-4">{item.price} ₺</p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">ID: {item.item_id}</p>
                                      <p className="mt-1 text-sm text-gray-500">Category: {item.category}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 md:ml-6 flex items-center space-x-2">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                    ${item.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                                      item.status === 'inTransit' ? 'bg-yellow-100 text-yellow-800' : 
                                      item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'}`}
                                  >
                                    {item.status === 'processing' ? <RefreshCw size={14} className="mr-1" /> : 
                                      item.status === 'inTransit' ? <Truck size={14} className="mr-1" /> : 
                                      item.status === 'delivered' ? <Check size={14} className="mr-1" /> :
                                      <Package size={14} className="mr-1" />}
                                    {item.status === 'processing' ? 'Processing' : 
                                      item.status === 'inTransit' ? 'In Transit' : 
                                      item.status === 'delivered' ? 'Delivered' :
                                      item.status === 'stillInStock' ? 'In Stock' : 'Unknown'}
                                  </span>
                                  
                                  <select 
                                    defaultValue={item.status || 'processing'}
                                    onChange={(e) => handleStatusUpdate(item.item_id, e.target.value)}
                                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  >
                                    <option value="processing">Processing</option>
                                    <option value="stillInStock">In Stock</option>
                                    <option value="inTransit">In Transit</option>
                                    <option value="delivered">Delivered</option>
                                  </select>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                      <Package size={40} className="text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No orders found.</p>
                    </div>
                  )}
                </div>
              );
          
          case 'setPrices':
            return (
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Set Product Prices</h2>
                </div>
                
                {priceLoading ? (
                  <div className="text-center py-10">
                    <RefreshCw size={40} className="text-blue-500 mx-auto mb-3 animate-spin" />
                    <p className="text-gray-500">Loading products...</p>
                  </div>
                ) : itemsWithoutPrice.length > 0 ? (
                  itemsWithoutPrice.map((item) => (
                    <div key={item.item_id} className="bg-white rounded-lg shadow-md p-4">
                      <div className="flex flex-col md:flex-row">
                        {/* Ürün resmi */}
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 mr-4">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover object-center" />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400">
                              <Package size={24} />
                            </div>
                          )}
                        </div>
                        
                        {/* Ürün bilgileri */}
                        <div className="flex-1">
                          <div className="mb-2">
                            <h3 className="font-medium text-gray-900">{item.title || 'Ürün Adı'}</h3>
                            <p className="text-sm text-gray-500">ID: {item.item_id}</p>
                            <p className="text-sm text-gray-600 mt-1">Category: {item.category || 'Belirtilmemiş'}</p>
                            <p className="text-sm text-gray-600">Condition: {item.condition || 'Belirtilmemiş'}</p>
                            <p className="text-sm text-gray-600">Description: {item.description ? (item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description) : 'Açıklama yok'}</p>
                          </div>
                        </div>
                        
                        {/* Fiyat giriş alanı */}
                        <div className="flex flex-col md:items-end space-y-2 mt-3 md:mt-0">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter price"
                              value={newPrice[item.item_id] || ''}
                              onChange={(e) => setNewPrice({...newPrice, [item.item_id]: e.target.value})}
                              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm w-32"
                            />
                            <span className="text-gray-700 font-medium">₺</span>
                          </div>
                          <button
                            onClick={() => handleSetPrice(item.item_id)}
                            disabled={priceLoading}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Check size={16} className="mr-1" />
                            Set Price
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                    <Package size={40} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No products without prices.</p>
                  </div>
                )}
              </div>
            );
      case 'unapprovedComments':
        return (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Comments Awaiting Approval</h2>
            </div>
            
            {unapprovedComments.length > 0 ? (
              unapprovedComments.map((comment) => (
                <div key={comment._id} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {comment.rating && renderStars(comment.rating)}
                      {!comment.rating && <span className="text-gray-500 text-sm">No rating</span>}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleApproveComment(comment._id)}
                        disabled={approvalLoading}
                        className="bg-green-100 text-green-700 p-2 rounded-md hover:bg-green-200 transition flex items-center"
                      >
                        <ThumbsUp size={16} className="mr-1" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRemoveComment(comment._id)}
                        disabled={approvalLoading}
                        className="bg-red-100 text-red-700 p-2 rounded-md hover:bg-red-200 transition flex items-center"
                      >
                        <X size={16} className="mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>From user: {comment.sender_id}</p>
                    <p>To user: {comment.receiver_id}</p>
                    {comment.item && <p>Product: {comment.item}</p>}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 bg-white rounded-lg shadow-sm">
                <AlertTriangle size={40} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No comments awaiting approval.</p>
              </div>
            )}
          </div>
        );
    
      default:
        return null;
    }
  }      

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* SUSOLD header is now a Link component that navigates to the homepage */}
          <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-800 transition">
            SUSOLD<span className="text-gray-800"></span>
          </Link>
          <button 
            onClick={handleLogout} 
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            <LogOut size={18} className="mr-1" />
            Logout
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="bg-blue-600 h-32 relative"></div>
          <div className="px-6 pt-0 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end">
              <div className="relative -mt-16 mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                  {userData.profileImage ? (
                    <img src={userData.profileImage} alt={userData.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-400">{userData.name.charAt(0)}</span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md">
                  <Edit size={16} />
                </button>
              </div>
              <div className="flex-1 mb-4 sm:mb-0 sm:ml-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">{userData.name}</h1>
                    <div className="flex items-center mt-1">
                      <div className="flex mr-2">
                        {renderStars(userData.rating)}
                      </div>
                      <span className="text-sm text-gray-500">({userData.rating}/5)</span>
                      {userData.is_verified && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full inline-flex items-center">
                          <Check size={12} className="mr-1" />
                          Verified
                        </span>
                      )}
                      {userData.isManager && (
                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full inline-flex items-center">
                          <Check size={12} className="mr-1" />
                          Manager
                        </span>
                      )}
                      {userData.isSalesManager && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full inline-flex items-center">
                          <Check size={12} className="mr-1" />
                          Sales Manager
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('offerings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'offerings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={18} className="mr-2" />
              My Products
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare size={18} className="mr-2" />
              Comments
            </button>
            {/* Yeni sekme: Satın Alınan Ürünler */}
            <button
              onClick={() => setActiveTab('purchases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'purchases'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingBag size={18} className="mr-2" />
              My Purchases
            </button>
            
            {/* Yönetici ise "Unapproved Comments" sekmesini göster */}
            {userData.isManager && (
              <button
                onClick={() => {
                  setActiveTab('manageOrders');
                  fetchAllOrders(); // Sekmeye geçince siparişleri yükle
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'manageOrders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package size={18} className="mr-2" />
                Manage Orders
              </button>
            )}
            {/* Yönetici ise "Unapproved Comments" sekmesini göster */}
            {userData.isManager && (
              <button
                onClick={() => setActiveTab('unapprovedComments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'unapprovedComments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertTriangle size={18} className="mr-2" />
                Unapproved Comments
              </button>
            )}

            {/* Sales Manager sekmeleri */}
            {userData.isSalesManager && (
              <>
                <button
                  onClick={() => setActiveTab('refundRequests')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'refundRequests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <RefreshCw size={18} className="mr-2" />
                  Refund Requests
                </button>
                <button
                  onClick={() => setActiveTab('setPrices')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'setPrices'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Map size={18} className="mr-2" />
                  Set Prices
                </button>
              </>
            )}
          </nav>
        </div>
        

        {renderTabContent()}
      </main>
    </div>
  );
};

export default UserProfile;