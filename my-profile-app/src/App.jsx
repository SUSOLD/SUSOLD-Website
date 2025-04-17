import { useState } from 'react';
import './App.css';
import './index.css';

import Sidebar from './components/Sidebar.jsx';
import MyProfile from './pages/MyProfile.jsx';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('profile');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`App ${sidebarOpen ? 'shifted' : ''}`}>
      <button className="hamburger" onClick={toggleSidebar}>☰</button>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onNavigate={setCurrentPage} />
      <div className="main-content">
        <MyProfile />
      </div>
    </div>
  );
}

export default App;
