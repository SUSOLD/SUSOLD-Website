
import axios from 'axios';

// Base URL for API
const API_URL = 'http://localhost:8000/api';


class AuthService {
  // User registration
  static async register(userData) {
    return axios.post(`${API_URL}/register`, userData);
  }

  // User login
  static async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email); // Email is sent as username for FastAPI OAuth2PasswordRequestForm
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.access_token) {
      this.setAuthData(response.data);
    }

    return response.data;
  }

  // Save token and token type to local storage
  static setAuthData(data) {
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('tokenType', data.token_type);
  }

  // Get token from local storage
  static getToken() {
    return localStorage.getItem('accessToken');
  }

  // Get token type (usually "bearer")
  static getTokenType() {
    return localStorage.getItem('tokenType');
  }

  // Check if user is logged in
  static isLoggedIn() {
    return !!this.getToken();
  }

  // Logout
  static logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenType');
  }

  // Create authorization header
  static getAuthHeader() {
    const token = this.getToken();
    const tokenType = this.getTokenType();
    console.log('Retrieved token:', token); 
    
    if (token && tokenType) {
      return { Authorization: `${tokenType} ${token}` };
    }
    return {};
  }
}

export default AuthService;