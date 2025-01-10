import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/App.css'

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(authService.isLoggedIn());
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
  };

  return (
    <div className="home-container">
      <header className="hero-section d-flex align-items-center">
        <div className="container text-center text-white">
          <h1 className="display-3 fw-bold mb-4">
            Welcome to <span className="text-primary">TimeGuard</span>
          </h1>
          <p className="lead mb-5">
            TimeGuard is your reliable tool for task management, time tracking, and generating detailed reports. Stay organized, boost your productivity, and never miss a deadline again!
          </p>
          {isLoggedIn ? (
            <div className="auth-section">
              <p className="mb-3">
                You are logged in. Use the dashboard to manage your tasks and reports.
              </p>
              <button className="btn btn-danger btn-lg btn-transition" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-section">
              <p className="mb-4">Get started by logging in or creating a new account.</p>
              <Link to="/login" className="btn btn-primary btn-lg me-3 btn-transition">
                Login
              </Link>
              <Link to="/register" className="btn btn-outline-light btn-lg btn-transition">
                Register
              </Link>
            </div>
          )}
        </div>
      </header>
      <section className="features-section py-5">
        <div className="container">
          <h2 className="text-center mb-4">Features of TimeGuard</h2>
          <div className="row">
            <div className="col-md-4 text-center feature-item">
              <div className="feature-icon mb-3">
                <i className="bi bi-list-task display-4 text-primary"></i>
              </div>
              <h4>Task Management</h4>
              <p>Organize your tasks, set priorities, and track progress.</p>
            </div>
            <div className="col-md-4 text-center feature-item">
              <div className="feature-icon mb-3">
                <i className="bi bi-clock-history display-4 text-primary"></i>
              </div>
              <h4>Time Tracker</h4>
              <p>Track the time spent on each task to boost your efficiency.</p>
            </div>
            <div className="col-md-4 text-center feature-item">
              <div className="feature-icon mb-3">
                <i className="bi bi-bar-chart-line display-4 text-primary"></i>
              </div>
              <h4>Reports</h4>
              <p>Generate detailed reports to analyze your productivity and efficiency.</p>
            </div>
          </div>
        </div>
      </section>
      <footer className="footer bg-dark text-white py-4">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} TimeGuard. All rights reserved.</p>
          <div className="social-icons">
            <a href="#" className="text-white me-3">
              <i className="bi bi-facebook"></i>
            </a>
            <a href="#" className="text-white me-3">
              <i className="bi bi-twitter"></i>
            </a>
            <a href="#" className="text-white">
              <i className="bi bi-linkedin"></i>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
