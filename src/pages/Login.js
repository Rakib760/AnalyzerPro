import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ''
  });
  const [validated, setValidated] = useState(false);
  const [forgotPasswordValidated, setForgotPasswordValidated] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  
  const { login, error, loading, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for redirect parameters
  const redirect = searchParams.get('redirect');
  const message = searchParams.get('message');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect || '/');
    }
  }, [isAuthenticated, navigate, redirect]);

  // Clear errors when component unmounts or form changes
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) clearError();
  };

  const handleForgotPasswordChange = (e) => {
    setForgotPasswordData({
      ...forgotPasswordData,
      [e.target.name]: e.target.value
    });
    setForgotPasswordError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    console.log('Attempting login with:', { email: formData.email }); // Debug log
    
    try {
      const result = await login(formData.email, formData.password);
      
      console.log('Login result:', result); // Debug log
      
      if (result.success) {
        console.log('Login successful, navigating to dashboard');
        navigate(redirect || '/');
      } else {
        console.log('Login failed:', result.message);
      }
    } catch (error) {
      console.error('Login error in component:', error);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setForgotPasswordValidated(true);
      return;
    }

    setForgotPasswordValidated(true);
    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordData.email }),
      });

      const data = await response.json();

      if (data.success) {
        setForgotPasswordMessage('Password reset instructions have been sent to your email.');
        setForgotPasswordData({ email: '' });
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordMessage('');
        }, 3000);
      } else {
        setForgotPasswordError(data.message || 'Failed to send reset instructions.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotPasswordError('An error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordData({ email: '' });
    setForgotPasswordError('');
    setForgotPasswordMessage('');
    setForgotPasswordValidated(false);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5} xl={4}>
          <Card className="shadow border-0">
            <Card.Body className="p-4 p-md-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-chart-line text-primary fa-2x"></i>
                </div>
                <h2 className="text-primary fw-bold">Welcome Back</h2>
                <p className="text-muted">Sign in to monitor your brand mentions</p>
              </div>

              {/* Success message from redirect */}
              {message && (
                <Alert variant="success" className="mb-3">
                  <i className="fas fa-check-circle me-2"></i>
                  {decodeURIComponent(message)}
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-3">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <div>
                      <strong>Login Failed</strong>
                      <div className="small">{error}</div>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Login Form */}
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="py-2"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid email address.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    placeholder="Enter your password"
                    className="py-2"
                  />
                  <Form.Control.Feedback type="invalid">
                    Password must be at least 6 characters long.
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check 
                    type="checkbox" 
                    id="remember-me"
                    label="Remember me"
                  />
                  <Button 
                    variant="link" 
                    className="text-decoration-none p-0"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-2 mb-3 fw-semibold" 
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In
                    </>
                  )}
                </Button>
              </Form>

              {/* Divider */}
              <div className="position-relative text-center my-4">
                <hr />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                  or
                </span>
              </div>

              {/* Sign up link */}
              <div className="text-center">
                <p className="mb-2">Don't have an account?</p>
                <Link 
                  to="/register" 
                  className="btn btn-outline-primary w-100 py-2 fw-semibold"
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Create New Account
                </Link>
              </div>

              {/* Demo Account Info */}
              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="text-center mb-2">
                  <i className="fas fa-info-circle me-2 text-info"></i>
                  Demo Access
                </h6>
                <div className="small text-muted text-center">
                  Use demo@brandtracker.com / demo123 to test the application
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Forgot Password Modal */}
      <Modal show={showForgotPassword} onHide={handleCloseForgotPassword} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-key me-2 text-primary"></i>
            Reset Your Password
          </Modal.Title>
        </Modal.Header>
        <Form noValidate validated={forgotPasswordValidated} onSubmit={handleForgotPasswordSubmit}>
          <Modal.Body>
            <p className="text-muted mb-4">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            {forgotPasswordMessage && (
              <Alert variant="success" className="mb-3">
                <i className="fas fa-check-circle me-2"></i>
                {forgotPasswordMessage}
              </Alert>
            )}

            {forgotPasswordError && (
              <Alert variant="danger" className="mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {forgotPasswordError}
              </Alert>
            )}

            <Form.Group>
              <Form.Label className="fw-semibold">Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={forgotPasswordData.email}
                onChange={handleForgotPasswordChange}
                required
                placeholder="Enter your email address"
                className="py-2"
              />
              <Form.Control.Feedback type="invalid">
                Please provide a valid email address.
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseForgotPassword}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Send Reset Instructions
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Features Section */}
      <Row className="mt-5 text-center">
        <Col md={4} className="mb-4">
          <div className="p-3">
            <i className="fas fa-chart-bar fa-2x text-primary mb-3"></i>
            <h5>Real-time Analytics</h5>
            <p className="text-muted mb-0">
              Track brand mentions with comprehensive analytics and insights
            </p>
          </div>
        </Col>
        <Col md={4} className="mb-4">
          <div className="p-3">
            <i className="fas fa-bullseye fa-2x text-primary mb-3"></i>
            <h5>Multi-source Monitoring</h5>
            <p className="text-muted mb-0">
              Monitor mentions from Twitter, Reddit, News, and more
            </p>
          </div>
        </Col>
        <Col md={4} className="mb-4">
          <div className="p-3">
            <i className="fas fa-bell fa-2x text-primary mb-3"></i>
            <h5>Smart Alerts</h5>
            <p className="text-muted mb-0">
              Get notified about sentiment spikes and important mentions
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;