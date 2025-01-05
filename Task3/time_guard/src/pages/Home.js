import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService'; // Сервіс для авторизації

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Перевіряємо, чи користувач авторизований
    setIsLoggedIn(authService.isLoggedIn());
  }, []);

  const handleLogout = () => {
    authService.logout(); // Логіка логауту
    setIsLoggedIn(false);  // Оновлюємо статус
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="text-center">
        <h1 className="display-4 mb-4">Welcome to TimeGuard</h1>
        <p className="lead mb-4">
          Manage your tasks, time entries, and reports with ease!
        </p>

        {/* Якщо користувач авторизований */}
        {isLoggedIn ? (
          <div>
            <p className="mb-3">You are already logged in.</p>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div>
            <Link to="/login" className="btn btn-primary me-2">
              Login
            </Link>
            <Link to="/register" className="btn btn-outline-secondary">
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
