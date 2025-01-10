import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import authService from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleRegister = async () => {
    if (!name || !email || !password || !passwordConfirmation) {
      toast.error('All fields are required.');
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      await authService.register(name, email, password, passwordConfirmation);
      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Something went wrong.';
      toast.error(`Registration error: ${errorMessage}`);
    }
  };

  return (
    <Container fluid className="auth-bg d-flex align-items-center justify-content-center min-vh-100">
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }}>
          <Card className="p-4 auth-card">
            <h2 className="text-center mb-4">Register</h2>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="lg"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="lg"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="lg"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                size="lg"
              />
            </Form.Group>
            <Button variant="primary" className="w-100 btn-transition" size="lg" onClick={handleRegister}>
              Register
            </Button>
            <div className="text-center mt-3">
              <span>Already have an account? </span>
              <Link to="/login">Login</Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
