// frontend/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { Star, Edit, Package, MessageSquare, Check, X, Plus, LogOut, AlertTriangle, ThumbsUp } from 'lucide-react';
import { getUserProfile, removeProduct, getProductById, getUnapprovedComments, approveComment, removeComment } from '../services/apiService';
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
    comments: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('offerings');
  const [unapprovedComments, setUnapprovedComments] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const navigate = useNavigate();

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
          isManager: profileData.isManager, // Yeni eklenen özellik
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

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} fill={i < rating ? '#FFD700' : 'none'} color={i < rating ? '#FFD700' : '#D1D5DB'} />
    ));
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
          </nav>
        </div>

        {renderTabContent()}
      </main>
    </div>
  );
};

export default UserProfile;