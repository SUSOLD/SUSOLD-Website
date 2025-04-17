// MyProfile.js
import React, { useState } from 'react';
import RatingsComments from '../components/RatingsComments.jsx';
import Offerings from '../components/Offerings.jsx';

const MyProfile = () => {
  const [activeTab, setActiveTab] = useState('ratings');

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Simay Karakis ✅</h2>
        <p>⭐ 3.2</p>
      </div>
      <div className="profile-tabs">
        <button onClick={() => setActiveTab('ratings')} className={activeTab === 'ratings' ? 'active' : ''}>Ratings and Comments</button>
        <button onClick={() => setActiveTab('offerings')} className={activeTab === 'offerings' ? 'active' : ''}>Offerings</button>
      </div>
      {activeTab === 'ratings' ? <RatingsComments /> : <Offerings />}
    </div>
  );
};

export default MyProfile;
