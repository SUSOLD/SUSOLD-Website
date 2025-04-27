import axios from 'axios';

const apiUrl = 'http://127.0.0.1:8000/api';  // API URL'niz burada belirtilmeli

export const userAPI = {
  getProfile: async () => {
    try {
      const response = await axios.get(`${apiUrl}/profile`);
      return response;
    } catch (error) {
      console.error("Error fetching profile", error);
      throw error;
    }
  }
};