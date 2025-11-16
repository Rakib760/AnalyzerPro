import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    industry: '',
    companySize: '',
    brands: []
  });
  const [validated, setValidated] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentBrand, setCurrentBrand] = useState('');
  
  const { register, error, loading, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password match in real-time
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'password') {
        setPasswordMatch(value === formData.confirmPassword);
        checkPasswordStrength(value);
      } else {
        setPasswordMatch(value === formData.password);
      }
    }

    // Clear error when user starts typing
    if (error) clearError();
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthVariant = () => {
    if (passwordStrength >= 75) return 'success';
    if (passwordStrength >= 50) return 'warning';
    if (passwordStrength >= 25) return 'info';
    return 'danger';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return 'Strong';
    if (passwordStrength >= 50) return 'Medium';
    if (passwordStrength >= 25) return 'Weak';
    return 'Very Weak';
  };

  const addBrand = () => {
    if (currentBrand.trim() && !formData.brands.includes(currentBrand.trim())) {
      setFormData(prev => ({
        ...prev,
        brands: [...prev.brands, currentBrand.trim()]
      }));
      setCurrentBrand('');
    }
  };

  const removeBrand = (brandToRemove) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.filter(brand => brand !== brandToRemove)
    }));
  };

  const handleBrandKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBrand();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false || !passwordMatch || passwordStrength < 50) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    
    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      company: formData.company.trim(),
      brands: formData.brands,
      profile: {
        industry: formData.industry,
        companySize: formData.companySize
      }
    };

    const result = await register(registrationData);
    
    if (result.success) {
      navigate('/onboarding');
    }
  };

  const industryOptions = [
    'Technology', 'Retail', 'Healthcare', 'Finance', 'Manufacturing',
    'Education', 'Entertainment', 'Food & Beverage', 'Automotive',
    'Fashion', 'Travel', 'Real Estate', 'Energy', 'Other'
  ];

  const companySizeOptions = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  ];

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col lg={8} xl={7}>
          <Card className="shadow border-0">
            <Card.Body className="p-4 p-md-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-chart-line text-primary fa-2x"></i>
                </div>
                <h2 className="text-primary fw-bold">Start Monitoring Your Brand</h2>
                <p className="text-muted">Create your account and begin tracking brand mentions across multiple platforms</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <div>
                      <strong>Registration Failed</strong>
                      <div className="small">{error}</div>
                    </div>
                  </div>
                </Alert>
              )}

              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {/* Personal Information */}
                <Card className="mb-4 border-0 bg-light">
                  <Card.Header className="bg-transparent border-0">
                    <h5 className="mb-0 text-primary">
                      <i className="fas fa-user me-2"></i>
                      Personal Information
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Full Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            Please provide your full name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Email Address *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email address"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            Please provide a valid email address.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Company Information */}
                <Card className="mb-4 border-0 bg-light">
                  <Card.Header className="bg-transparent border-0">
                    <h5 className="mb-0 text-primary">
                      <i className="fas fa-building me-2"></i>
                      Company Information
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Company Name *</Form.Label>
                          <Form.Control
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            placeholder="Enter your company name"
                            className="py-2"
                          />
                          <Form.Control.Feedback type="invalid">
                            Please provide your company name.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Industry</Form.Label>
                          <Form.Select
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className="py-2"
                          >
                            <option value="">Select Industry</option>
                            {industryOptions.map(industry => (
                              <option key={industry} value={industry}>{industry}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Company Size</Form.Label>
                          <Form.Select
                            name="companySize"
                            value={formData.companySize}
                            onChange={handleChange}
                            className="py-2"
                          >
                            <option value="">Select Company Size</option>
                            {companySizeOptions.map(size => (
                              <option key={size} value={size}>{size} employees</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Brands to Monitor */}
                <Card className="mb-4 border-0 bg-light">
                  <Card.Header className="bg-transparent border-0">
                    <h5 className="mb-0 text-primary">
                      <i className="fas fa-tags me-2"></i>
                      Brands to Monitor
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Add Brands</Form.Label>
                      <div className="d-flex gap-2 mb-3">
                        <Form.Control
                          type="text"
                          value={currentBrand}
                          onChange={(e) => setCurrentBrand(e.target.value)}
                          onKeyPress={handleBrandKeyPress}
                          placeholder="Enter brand name"
                          className="py-2"
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={addBrand}
                          disabled={!currentBrand.trim()}
                          className="px-3"
                        >
                          <i className="fas fa-plus"></i>
                        </Button>
                      </div>
                      <Form.Text className="text-muted">
                        Add the brands you want to monitor. You can add up to 3 brands on the free plan.
                      </Form.Text>
                    </Form.Group>

                    {/* Selected Brands */}
                    {formData.brands.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Selected Brands:</label>
                        <div className="d-flex flex-wrap gap-2">
                          {formData.brands.map(brand => (
                            <Badge key={brand} bg="primary" className="fs-6 p-2 d-flex align-items-center">
                              {brand}
                              <button
                                type="button"
                                className="btn-close btn-close-white ms-2"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => removeBrand(brand)}
                                aria-label="Remove brand"
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Security */}
                <Card className="mb-4 border-0 bg-light">
                  <Card.Header className="bg-transparent border-0">
                    <h5 className="mb-0 text-primary">
                      <i className="fas fa-shield-alt me-2"></i>
                      Security
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Password *</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="8"
                            placeholder="Create a strong password"
                            className="py-2"
                            isInvalid={!passwordMatch && formData.confirmPassword}
                          />
                          <Form.Control.Feedback type="invalid">
                            Password must be at least 8 characters.
                          </Form.Control.Feedback>
                          
                          {/* Password Strength Meter */}
                          {formData.password && (
                            <div className="mt-2">
                              <div className="d-flex justify-content-between small">
                                <span>Password Strength:</span>
                                <span className={`text-${getPasswordStrengthVariant()}`}>
                                  {getPasswordStrengthText()}
                                </span>
                              </div>
                              <ProgressBar 
                                variant={getPasswordStrengthVariant()} 
                                now={passwordStrength} 
                                className="mt-1"
                                style={{ height: '4px' }}
                              />
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Confirm Password *</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                            className="py-2"
                            isInvalid={!passwordMatch}
                          />
                          <Form.Control.Feedback type="invalid">
                            {formData.confirmPassword ? 'Passwords do not match.' : 'Please confirm your password.'}
                          </Form.Control.Feedback>
                          {passwordMatch && formData.confirmPassword && (
                            <Form.Text className="text-success">
                              <i className="fas fa-check me-1"></i>
                              Passwords match
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Terms and Submit */}
                <div className="mb-4">
                  <Form.Check 
                    type="checkbox" 
                    id="terms-agreement"
                    label={
                      <span>
                        I agree to the{' '}
                        <a href="/terms" className="text-decoration-none">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-decoration-none">Privacy Policy</a>
                      </span>
                    }
                    required
                  />
                </div>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-2 mb-3 fw-semibold" 
                  disabled={loading || !passwordMatch || passwordStrength < 50}
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
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket me-2"></i>
                      Start Monitoring My Brands
                    </>
                  )}
                </Button>
              </Form>

              {/* Divider */}
              <div className="position-relative text-center my-4">
                <hr />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                  Already have an account?
                </span>
              </div>

              {/* Sign in link */}
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="btn btn-outline-primary w-100 py-2 fw-semibold"
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In to Existing Account
                </Link>
              </div>

              {/* Trial Info */}
              <Alert variant="info" className="mt-4 mb-0">
                <div className="d-flex align-items-center">
                  <i className="fas fa-gift me-2 fs-5"></i>
                  <div>
                    <strong>14-Day Free Trial</strong> - Get full access to all features with no credit card required.
                    Monitor up to 3 brands with real-time analytics and multi-platform tracking.
                  </div>
                </div>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Features Section */}
      <Row className="mt-5 text-center">
        <Col md={4} className="mb-4">
          <div className="p-3">
            <i className="fas fa-search fa-2x text-primary mb-3"></i>
            <h5>Multi-Source Monitoring</h5>
            <p className="text-muted mb-0">
              Track mentions from Twitter, Reddit, News sites, and more in one dashboard
            </p>
          </div>
        </Col>
        <Col md={4} className="mb-4">
          <div className="p-3">
            <i className="fas fa-chart-pie fa-2x text-primary mb-3"></i>
            <h5>Sentiment Analysis</h5>
            <p className="text-muted mb-0">
              AI-powered sentiment analysis to understand customer perception
            </p>
          </div>
        </Col>
        <Col md={4} className="mb-4">
          <div className="p-3">
            <i className="fas fa-bell fa-2x text-primary mb-3"></i>
            <h5>Real-time Alerts</h5>
            <p className="text-muted mb-0">
              Get instant notifications for brand mentions and sentiment spikes
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;