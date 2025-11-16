import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, 
  ListGroup, Badge, Spinner, Modal, ProgressBar, Tab, Nav
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user, updateUserBrands, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('brands');
  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    company: '',
    profile: {
      industry: '',
      companySize: '',
      website: '',
      phone: '',
      location: ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    weeklyReports: true,
    sentimentAlerts: true,
    spikeAlerts: true,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setBrands(user.brands?.map(brand => typeof brand === 'string' ? { name: brand, isActive: true } : brand) || []);
      setProfileData({
        name: user.name || '',
        company: user.company || '',
        profile: {
          industry: user.profile?.industry || '',
          companySize: user.profile?.companySize || '',
          website: user.profile?.website || '',
          phone: user.profile?.phone || '',
          location: user.profile?.location || ''
        }
      });
      setPreferences({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        weeklyReports: user.preferences?.weeklyReports ?? true,
        sentimentAlerts: user.preferences?.sentimentAlerts ?? true,
        spikeAlerts: user.preferences?.spikeAlerts ?? true,
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [user]);

  const handleAddBrand = () => {
    if (newBrand.trim() && !brands.find(b => b.name.toLowerCase() === newBrand.trim().toLowerCase())) {
      // Check brand limit based on subscription
      const maxBrands = user?.subscription?.features?.maxBrands || 3;
      if (brands.length >= maxBrands) {
        setMessage({ 
          type: 'warning', 
          text: `You've reached the maximum of ${maxBrands} brands on your current plan. Upgrade to monitor more brands.` 
        });
        return;
      }

      setBrands([...brands, { name: newBrand.trim(), isActive: true }]);
      setNewBrand('');
    }
  };

  const handleRemoveBrand = (brandName) => {
    setBrands(brands.filter(brand => brand.name !== brandName));
  };

  const handleToggleBrand = (brandName) => {
    setBrands(brands.map(brand => 
      brand.name === brandName 
        ? { ...brand, isActive: !brand.isActive }
        : brand
    ));
  };

  const handleSaveBrands = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    const activeBrands = brands.filter(brand => brand.isActive);
    if (activeBrands.length === 0) {
      setMessage({ type: 'danger', text: 'Please add at least one active brand' });
      setLoading(false);
      return;
    }

    const result = await updateUserBrands(activeBrands);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Brands updated successfully!' });
    } else {
      setMessage({ type: 'danger', text: result.message });
    }
    
    setLoading(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await updateProfile(profileData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'danger', text: result.message });
    }
    
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'danger', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'New password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setMessage({ type: 'danger', text: result.message });
    }
    
    setLoading(false);
  };

  const handlePreferencesSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    // In a real app, you would call an API to save preferences
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
      setLoading(false);
    }, 1000);
  };

  const industryOptions = [
    'Technology', 'Retail', 'Healthcare', 'Finance', 'Manufacturing',
    'Education', 'Entertainment', 'Food & Beverage', 'Automotive',
    'Fashion', 'Travel', 'Real Estate', 'Energy', 'Other'
  ];

  const companySizeOptions = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  ];

  const timezoneOptions = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney'
  ];

  const getSubscriptionVariant = (plan) => {
    const variants = {
      free: 'secondary',
      starter: 'primary',
      professional: 'success',
      enterprise: 'warning'
    };
    return variants[plan] || 'secondary';
  };

  const getPlanLimits = () => {
    const plan = user?.subscription?.plan || 'free';
    const limits = {
      free: { brands: 3, mentions: 1000, features: ['Basic monitoring', '7-day data retention'] },
      starter: { brands: 10, mentions: 10000, features: ['Advanced analytics', '30-day data retention', 'Email support'] },
      professional: { brands: 50, mentions: 50000, features: ['Real-time monitoring', '90-day data retention', 'Priority support', 'API access'] },
      enterprise: { brands: 'Unlimited', mentions: 'Unlimited', features: ['Custom solutions', '1-year data retention', 'Dedicated support', 'White-label options'] }
    };
    return limits[plan] || limits.free;
  };

  const planLimits = getPlanLimits();

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h1 className="h2 mb-1">Settings & Preferences</h1>
              <p className="text-muted mb-0">Manage your account, brands, and monitoring preferences</p>
            </div>
            <Badge bg={getSubscriptionVariant(user?.subscription?.plan)} className="fs-6">
              {user?.subscription?.plan?.toUpperCase()} PLAN
            </Badge>
          </div>
        </Col>
      </Row>

      {message.text && (
        <Alert variant={message.type} className="mb-4">
          <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {message.text}
        </Alert>
      )}

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Row>
          {/* Sidebar Navigation */}
          <Col lg={3} className="mb-4">
            <Card>
              <Card.Body className="p-3">
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="brands" className="d-flex align-items-center">
                      <i className="fas fa-tags me-2"></i>
                      Brand Management
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="profile" className="d-flex align-items-center">
                      <i className="fas fa-user me-2"></i>
                      Profile Settings
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="security" className="d-flex align-items-center">
                      <i className="fas fa-shield-alt me-2"></i>
                      Security
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="preferences" className="d-flex align-items-center">
                      <i className="fas fa-cog me-2"></i>
                      Preferences
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="subscription" className="d-flex align-items-center">
                      <i className="fas fa-crown me-2"></i>
                      Subscription
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>

            {/* Account Summary */}
            <Card className="mt-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Account Summary</h6>
              </Card.Header>
              <Card.Body className="p-3">
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                    <span className="text-muted">Plan</span>
                    <strong className="text-capitalize">{user?.subscription?.plan || 'free'}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                    <span className="text-muted">Brands</span>
                    <strong>{brands.filter(b => b.isActive).length} / {planLimits.brands}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                    <span className="text-muted">Status</span>
                    <Badge bg={user?.status === 'active' ? 'success' : 'warning'}>
                      {user?.status || 'active'}
                    </Badge>
                  </ListGroup.Item>
                  {user?.isTrialActive && (
                    <ListGroup.Item className="px-0 py-2">
                      <div className="text-center">
                        <Badge bg="warning" className="mb-2">
                          Trial: {user.trialDaysLeft} days left
                        </Badge>
                        <ProgressBar 
                          variant="warning" 
                          now={(user.trialDaysLeft / 14) * 100} 
                          style={{ height: '4px' }}
                        />
                      </div>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={9}>
            <Tab.Content>
              {/* Brand Management Tab */}
              <Tab.Pane eventKey="brands">
                <Card>
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">
                      <i className="fas fa-tags me-2"></i>
                      Brand Management
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold">Add New Brand</Form.Label>
                          <div className="d-flex gap-2">
                            <Form.Control
                              type="text"
                              value={newBrand}
                              onChange={(e) => setNewBrand(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                              placeholder="Enter brand name"
                              className="py-2"
                            />
                            <Button 
                              variant="primary" 
                              onClick={handleAddBrand}
                              disabled={!newBrand.trim()}
                              className="px-3"
                            >
                              <i className="fas fa-plus"></i>
                            </Button>
                          </div>
                          <Form.Text className="text-muted">
                            You can monitor up to {planLimits.brands} brands on your current plan.
                            {brands.length >= planLimits.brands && (
                              <span className="text-warning"> Upgrade to monitor more brands.</span>
                            )}
                          </Form.Text>
                        </Form.Group>

                        {/* Brands List */}
                        <div className="mb-4">
                          <h6 className="fw-semibold mb-3">
                            Your Brands ({brands.filter(b => b.isActive).length} active)
                          </h6>
                          {brands.length === 0 ? (
                            <Alert variant="info" className="mb-0">
                              <i className="fas fa-info-circle me-2"></i>
                              No brands added yet. Start by adding your first brand above.
                            </Alert>
                          ) : (
                            <div className="list-group">
                              {brands.map((brand, index) => (
                                <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                  <div className="d-flex align-items-center">
                                    <Form.Check
                                      type="switch"
                                      checked={brand.isActive}
                                      onChange={() => handleToggleBrand(brand.name)}
                                      className="me-3"
                                    />
                                    <span className={brand.isActive ? 'fw-semibold' : 'text-muted'}>
                                      {brand.name}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveBrand(brand.name)}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button 
                          variant="primary" 
                          onClick={handleSaveBrands}
                          disabled={loading || brands.filter(b => b.isActive).length === 0}
                          className="px-4"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </Col>

                      <Col md={4}>
                        <Card className="bg-light border-0">
                          <Card.Body>
                            <h6 className="fw-semibold mb-3">Quick Add Brands</h6>
                            <div className="d-grid gap-2">
                              {['Nike', 'Apple', 'Google', 'Microsoft', 'Amazon', 'Tesla'].map(brand => (
                                <Button
                                  key={brand}
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    setNewBrand(brand);
                                    handleAddBrand();
                                  }}
                                  disabled={brands.find(b => b.name === brand)}
                                >
                                  + {brand}
                                </Button>
                              ))}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Profile Settings Tab */}
              <Tab.Pane eventKey="profile">
                <Card>
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">
                      <i className="fas fa-user me-2"></i>
                      Profile Settings
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleProfileUpdate}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Full Name *</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.name}
                              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                              required
                              className="py-2"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Company *</Form.Label>
                            <Form.Control
                              type="text"
                              value={profileData.company}
                              onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                              required
                              className="py-2"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Industry</Form.Label>
                            <Form.Select
                              value={profileData.profile.industry}
                              onChange={(e) => setProfileData({
                                ...profileData, 
                                profile: {...profileData.profile, industry: e.target.value}
                              })}
                              className="py-2"
                            >
                              <option value="">Select Industry</option>
                              {industryOptions.map(industry => (
                                <option key={industry} value={industry}>{industry}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Company Size</Form.Label>
                            <Form.Select
                              value={profileData.profile.companySize}
                              onChange={(e) => setProfileData({
                                ...profileData, 
                                profile: {...profileData.profile, companySize: e.target.value}
                              })}
                              className="py-2"
                            >
                              <option value="">Select Size</option>
                              {companySizeOptions.map(size => (
                                <option key={size} value={size}>{size} employees</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Website</Form.Label>
                            <Form.Control
                              type="url"
                              value={profileData.profile.website}
                              onChange={(e) => setProfileData({
                                ...profileData, 
                                profile: {...profileData.profile, website: e.target.value}
                              })}
                              placeholder="https://example.com"
                              className="py-2"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Phone</Form.Label>
                            <Form.Control
                              type="tel"
                              value={profileData.profile.phone}
                              onChange={(e) => setProfileData({
                                ...profileData, 
                                profile: {...profileData.profile, phone: e.target.value}
                              })}
                              placeholder="+1 (555) 123-4567"
                              className="py-2"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">Location</Form.Label>
                        <Form.Control
                          type="text"
                          value={profileData.profile.location}
                          onChange={(e) => setProfileData({
                            ...profileData, 
                            profile: {...profileData.profile, location: e.target.value}
                          })}
                          placeholder="City, Country"
                          className="py-2"
                        />
                      </Form.Group>

                      <Button 
                        variant="primary" 
                        type="submit"
                        disabled={loading}
                        className="px-4"
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Profile'
                        )}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Security Tab */}
              <Tab.Pane eventKey="security">
                <Card>
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">
                      <i className="fas fa-shield-alt me-2"></i>
                      Security Settings
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handlePasswordChange}>
                      <Row>
                        <Col md={8}>
                          <h6 className="fw-semibold mb-3">Change Password</h6>
                          
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Current Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              required
                              className="py-2"
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">New Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              required
                              minLength="6"
                              className="py-2"
                            />
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Confirm New Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              required
                              className="py-2"
                              isInvalid={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                            />
                            <Form.Control.Feedback type="invalid">
                              Passwords do not match
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Button 
                            variant="primary" 
                            type="submit"
                            disabled={loading}
                            className="px-4"
                          >
                            {loading ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </Button>
                        </Col>
                      </Row>
                    </Form>

                    <hr className="my-4" />

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-semibold mb-1">Two-Factor Authentication</h6>
                        <p className="text-muted mb-0">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline-primary" size="sm">
                        Enable 2FA
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Preferences Tab */}
              <Tab.Pane eventKey="preferences">
                <Card>
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">
                      <i className="fas fa-cog me-2"></i>
                      Notification Preferences
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="switch"
                            id="email-notifications"
                            label="Email Notifications"
                            checked={preferences.emailNotifications}
                            onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
                          />
                          <Form.Text className="text-muted">
                            Receive email notifications for important updates and alerts
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Check
                            type="switch"
                            id="weekly-reports"
                            label="Weekly Reports"
                            checked={preferences.weeklyReports}
                            onChange={(e) => setPreferences({...preferences, weeklyReports: e.target.checked})}
                          />
                          <Form.Text className="text-muted">
                            Get weekly summary reports of your brand mentions
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Check
                            type="switch"
                            id="sentiment-alerts"
                            label="Sentiment Alerts"
                            checked={preferences.sentimentAlerts}
                            onChange={(e) => setPreferences({...preferences, sentimentAlerts: e.target.checked})}
                          />
                          <Form.Text className="text-muted">
                            Receive alerts for significant sentiment changes
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Check
                            type="switch"
                            id="spike-alerts"
                            label="Mention Spike Alerts"
                            checked={preferences.spikeAlerts}
                            onChange={(e) => setPreferences({...preferences, spikeAlerts: e.target.checked})}
                          />
                          <Form.Text className="text-muted">
                            Get notified when there's a spike in brand mentions
                          </Form.Text>
                        </Form.Group>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold">Language</Form.Label>
                              <Form.Select
                                value={preferences.language}
                                onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                                className="py-2"
                              >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold">Timezone</Form.Label>
                              <Form.Select
                                value={preferences.timezone}
                                onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                                className="py-2"
                              >
                                {timezoneOptions.map(tz => (
                                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Button 
                          variant="primary" 
                          onClick={handlePreferencesSave}
                          disabled={loading}
                          className="px-4"
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Preferences'
                          )}
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Subscription Tab */}
              <Tab.Pane eventKey="subscription">
                <Card>
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">
                      <i className="fas fa-crown me-2"></i>
                      Subscription Plan
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <div className="d-flex align-items-center mb-4">
                          <Badge bg={getSubscriptionVariant(user?.subscription?.plan)} className="fs-6 me-3">
                            {user?.subscription?.plan?.toUpperCase()}
                          </Badge>
                          <div>
                            <h5 className="mb-1">{user?.subscription?.plan?.charAt(0).toUpperCase() + user?.subscription?.plan?.slice(1)} Plan</h5>
                            <p className="text-muted mb-0">
                              {user?.subscription?.status === 'trial' ? 
                                `Trial ends in ${user.trialDaysLeft} days` : 
                                `Active until ${new Date(user?.subscription?.trialEndsAt).toLocaleDateString()}`
                              }
                            </p>
                          </div>
                        </div>

                        <h6 className="fw-semibold mb-3">Plan Features</h6>
                        <ListGroup variant="flush" className="mb-4">
                          <ListGroup.Item className="px-0">
                            <i className="fas fa-check text-success me-2"></i>
                            Monitor up to {planLimits.brands} brands
                          </ListGroup.Item>
                          <ListGroup.Item className="px-0">
                            <i className="fas fa-check text-success me-2"></i>
                            {planLimits.mentions} mentions per month
                          </ListGroup.Item>
                          {planLimits.features.map((feature, index) => (
                            <ListGroup.Item key={index} className="px-0">
                              <i className="fas fa-check text-success me-2"></i>
                              {feature}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>

                        <Button variant="primary" className="me-2">
                          Upgrade Plan
                        </Button>
                        <Button variant="outline-secondary">
                          View Billing
                        </Button>
                      </Col>

                      <Col md={4}>
                        <Card className="bg-light border-0">
                          <Card.Body>
                            <h6 className="fw-semibold mb-3">Usage Statistics</h6>
                            <div className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <small>Brands</small>
                                <small>{brands.filter(b => b.isActive).length} / {planLimits.brands}</small>
                              </div>
                              <ProgressBar 
                                now={(brands.filter(b => b.isActive).length / planLimits.brands) * 100} 
                                variant={brands.filter(b => b.isActive).length >= planLimits.brands ? 'warning' : 'primary'}
                                style={{ height: '6px' }}
                              />
                            </div>
                            <div className="mb-3">
                              <div className="d-flex justify-content-between mb-1">
                                <small>Monthly Mentions</small>
                                <small>0 / {planLimits.mentions}</small>
                              </div>
                              <ProgressBar 
                                now={0} 
                                variant="primary"
                                style={{ height: '6px' }}
                              />
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <p>Are you sure you want to delete your account? This will remove:</p>
          <ul>
            <li>All your brand monitoring data</li>
            <li>Analytics and reports</li>
            <li>Account information</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger">
            Delete Account
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Settings;