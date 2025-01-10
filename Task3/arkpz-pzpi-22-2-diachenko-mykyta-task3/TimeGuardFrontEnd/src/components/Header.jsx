import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const Header = () => {
  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <header className="d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
      <nav>
        <Link to="/dashboard" className="btn btn-outline-primary me-2">Dashboard</Link>
        <Link to="/tasks" className="btn btn-outline-primary me-2">Tasks</Link>
      </nav>
      <div>
        <Link to="/profile" className="btn btn-outline-secondary me-2">My Profile</Link>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
