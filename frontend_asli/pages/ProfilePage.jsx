import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/apiService';  // Import the API function

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);  // To manage loading state
  const [error, setError] = useState(null);  // To handle errors

  useEffect(() => {
    // Fetch profile data when component mounts
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile();  // Make the API call
        setProfile(response.data);
        setLoading(false);  // Set loading to false once data is fetched
      } catch (error) {
        setError("Error fetching profile");
        setLoading(false);  // Stop loading on error
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <p>Loading...</p>;  // Display loading while fetching data
  }

  if (error) {
    return <p>{error}</p>;  // Display error message if there's an error
  }

  return (
    <div>
      {profile ? (
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
          {/* Display other profile details */}
        </div>
      ) : (
        <p>No profile data available.</p>
      )}
    </div>
  );
};

export default ProfilePage;