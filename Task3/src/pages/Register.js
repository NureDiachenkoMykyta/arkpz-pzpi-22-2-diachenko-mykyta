import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Перевіряємо, чи користувач вже авторизований
    if (authService.isLoggedIn()) {
      navigate('/dashboard'); // Перенаправлення на Dashboard, якщо авторизований
    }
  }, [navigate]);

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!name || !email || !password || !passwordConfirmation) {
      setError('All fields are required');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    try {
      await authService.register(name, email, password, passwordConfirmation);
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow p-4 w-100" style={{ maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Register</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <input
          type="text"
          placeholder="Name"
          className="form-control mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <input
          type="password"
          placeholder="Confirm Password"
          className="form-control mb-3"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />
        <button className="btn btn-success w-100" onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;
