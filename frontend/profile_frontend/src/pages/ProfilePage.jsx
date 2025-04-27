import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/apiService';  // Import the API function

const UserProfile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Fetch profile data when component mounts
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile(); // Make the API call
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div>
      {profile ? (
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
          {/* Display other profile details */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default UserProfile;