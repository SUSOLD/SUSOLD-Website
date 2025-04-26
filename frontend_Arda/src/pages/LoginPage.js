import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Gerçek bir auth işlemi yerine sadece örnek
    setIsLoggedIn(true);
    navigate('/'); // login sonrası anasayfaya yönlendir
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login Page</h2>
      <button onClick={handleLogin} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Login
      </button>
    </div>
  );
};

export default LoginPage;