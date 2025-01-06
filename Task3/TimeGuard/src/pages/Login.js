import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // Сервіс для авторизації

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Перевіряємо, чи користувач уже авторизований
    if (authService.isLoggedIn()) {
      navigate('/dashboard'); // Перенаправлення на Dashboard, якщо авторизований
    }
  }, [navigate]);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      await authService.login(email, password);
      navigate('/dashboard'); // Перенаправлення на Dashboard після успішного логіну
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow p-4 w-100" style={{ maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          className="form-control mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="form-control mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary w-100" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
