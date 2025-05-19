import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addToBasketLocal } from '../services/apiService'; // ✅ Import local basket function
import { basketAPI, checkItemInStock } from '../services/apiService';

const ProductDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false); // ✅ delivered kontrolü
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [sellerFeedbacks, setSellerFeedbacks] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false); // favorilenmis mi kontrolü

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          setIsLoggedIn(true);
                  // ürün favorilerde mi değil mi diye kontrol etme
          const favoritesRes = await fetch("http://127.0.0.1:8000/api/favorites", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const favoritesData = await favoritesRes.json();
          const favIds = favoritesData.favorites.map(f => f.item_id);
          setIsFavorite(favIds.includes(itemId));

        } 
        
        else {
          setIsLoggedIn(false);
        }
  
        // Ürün bilgisi çekiliyor
        const productRes = await fetch(`http://127.0.0.1:8000/api/home/item/${itemId}`);
        const productData = await productRes.json();
        setProduct(productData);
  
        // Ürün geldikten sonra: Satıcının feedbackleri çekiliyor
        if (productData.user_id) {
          const feedbackRes = await fetch(`http://127.0.0.1:8000/api/seller_feedbacks?seller_id=${productData.user_id}`);
          const feedbackData = await feedbackRes.json();
          setSellerFeedbacks(feedbackData.feedbacks_received || []);
        }
  
        // Eğer login olduysak: ürün delivered mı diye kontrol ediliyor
        if (token) {
          const isDeliveredRes = await fetch(`http://127.0.0.1:8000/api/is_delivered?item_id=${itemId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
  
          if (isDeliveredRes.status === 401) {
            console.warn('Unauthorized to check delivery status.');
            return;
          }
  
          const isDeliveredData = await isDeliveredRes.json();
          setIsDelivered(isDeliveredData === true);
        }
      } catch (err) {
        console.error('Error during fetching data:', err);
      }
    };
  
    fetchData();
  }, [itemId]);
  

  const handleAddToFavorites = async () => {
    const token = localStorage.getItem('accessToken');
    const tokenType = localStorage.getItem('tokenType');

    if (!isLoggedIn) {
      alert('Please login to manage favorites.');
      navigate('/login');
      return;
    }

    try {
      const url = `http://127.0.0.1:8000/api/favorites/${itemId}`;
      const options = {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          Authorization: `${tokenType} ${token}`
        }
      };

      const response = await fetch(url, options);

      if (response.ok) {
        setIsFavorite(!isFavorite);
        alert(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      } else {
        alert('Failed to update favorites.');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      alert('Error updating favorites.');
    }
  };

  const handleAddToBasket = async (itemId) => {
    const token = localStorage.getItem('accessToken');
    const inStock = await checkItemInStock(itemId);
    if (!inStock) {
      alert('Out of stock! Cannot add to basket.');
      return;
    } else {
      if (token) {
        try {
          await basketAPI.toggleBasketItem(itemId);
          alert('Item added to basket!');
        } catch (error) {
          console.error('Error adding item to basket:', error);
          alert('Failed to add item to basket. Please login again.');
        }
      } else {
        addToBasketLocal(itemId);
        alert('Item added to basket!');
      }
    }
  };

  // ✅ Yorum gönderme fonksiyonu
  const handleSubmitFeedback = async () => {
    if (!rating && !comment.trim()) {
      alert('Please provide at least a rating or a comment.');
      return;
    }
  
    try {
      const token = localStorage.getItem('accessToken'); // ✅ accessToken olacak
      if (!token) {
        alert('You must be logged in to submit feedback.');
        return;
      }
  
      const response = await fetch('http://127.0.0.1:8000/api/send_feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` // ✅ doğru token yolluyoruz
        },
        body: JSON.stringify({
          seller_id: product.user_id,
          rating: rating ? Number(rating) : null,
          comment: comment.trim() || null,
          item: product.item_id
        })
      });
  
      if (response.ok) {
        alert('Feedback submitted successfully!');
        setRating('');
        setComment('');
      } else {
        const errorData = await response.json();
        alert(`Error submitting feedback: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback.');
    }
  };
  

  if (!product) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{product.title}</h2>
      <img src={product.image} alt={product.title} style={{ width: '200px' }} />
      <p><b>Description:</b> {product.description}</p>
      <p><b>Price:</b> {product.price} TL</p>
      <p><b>Condition:</b> {product.condition}</p>
      <p><b>Stock Status:</b> {product.inStock ? "In Stock" : "Out of Stock"}</p>
      <p><b>Brand:</b> {product.brand}</p>
      <p><b>Category:</b> {product.category} / {product.sub_category}</p>
      <p><b>Age:</b> {product.age}</p>
      <p><b>Dorm item:</b> {product.dorm ? 'Yes' : 'No'}</p>
      <p><b>Course item:</b> {product.course || 'N/A'}</p>
      <p><b>Verified:</b> {product.verified ? 'Yes' : 'No'}</p>
      <p><b>Returnable:</b> {product.returnable ? 'Yes' : 'No'}</p>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleAddToFavorites} style={styles.buttonSecondary}> 
          {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </button>

        <button onClick={() => handleAddToBasket(product.item_id)} style={styles.buttonPrimary}>Add to Basket</button>
      </div>

      {/* ✅ Delivered ürünler için yorum gönderme formu */}
      {isDelivered && (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
          <h3>Leave Feedback</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>Rating (1-5): </label>
            <input
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              min="1"
              max="5"
              style={{ width: '60px', marginLeft: '10px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Comment:</label><br/>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              cols="50"
            />
          </div>
          <button onClick={handleSubmitFeedback} style={styles.buttonPrimary}>Submit Feedback</button>
        </div>
      )}

      {/* ✅ SELLER FEEDBACKS DISPLAY ----> bura yeni */}
      {sellerFeedbacks.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3>Seller Feedbacks</h3>
          {sellerFeedbacks.map((fb, index) => (
            <div key={index} style={{ borderBottom: '1px solid #ccc', marginBottom: '10px', paddingBottom: '10px' }}>
              <p><b>Rating:</b> {fb.rating || 'No rating'}</p>
              <p><b>Comment:</b> {fb.comment || 'No comment'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  buttonPrimary: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};

export default ProductDetail;
