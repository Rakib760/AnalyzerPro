import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show loading state
  if (loading) {
    return (
      <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <BootstrapNavbar.Brand>
            <i className="fas fa-chart-line me-2"></i>
            Brand Mention Tracker
          </BootstrapNavbar.Brand>
          <div className="text-light ms-auto">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Container>
      </BootstrapNavbar>
    );
  }

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Custom CSS classes for active navigation links
  const activeLinkClass = 'active-nav-link';

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4 custom-navbar" fixed="top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <i className="fas fa-chart-line me-2"></i>
          <span>Brand Mention Tracker</span>
          {process.env.NODE_ENV === 'development' && (
            <Badge bg="secondary" className="ms-2" text="light">DEV</Badge>
          )}
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {isAuthenticated ? (
            <>
              <Nav className="me-auto">
                <Nav.Link 
                  as={Link} 
                  to="/" 
                  className={isActiveRoute('/') ? activeLinkClass : ''}
                >
                  <i className="fas fa-tachometer-alt me-1"></i>
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/mentions"
                  className={isActiveRoute('/mentions') ? activeLinkClass : ''}
                >
                  <i className="fas fa-comment-alt me-1"></i>
                  Mentions
                  {user?.unreadMentions > 0 && (
                    <Badge bg="danger" className="ms-1" pill>
                      {user.unreadMentions}
                    </Badge>
                  )}
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/analytics"
                  className={isActiveRoute('/analytics') ? activeLinkClass : ''}
                >
                  <i className="fas fa-chart-bar me-1"></i>
                  Analytics
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/sources"
                  className={isActiveRoute('/sources') ? activeLinkClass : ''}
                >
                  <i className="fas fa-plug me-1"></i>
                  Data Sources
                </Nav.Link>
              </Nav>
              <Nav>
                {user?.isTrialActive && (
                  <Nav.Item className="d-flex align-items-center me-3">
                    <Badge bg="warning" text="dark">
                      <i className="fas fa-clock me-1"></i>
                      Trial: {user.trialDaysLeft} days left
                    </Badge>
                  </Nav.Item>
                )}
                <NavDropdown 
                  title={
                    <span className="d-flex align-items-center">
                      <i className="fas fa-user-circle me-2"></i>
                      <span className="me-1">{user?.name}</span>
                      {user?.role === 'admin' && (
                        <Badge bg="info" className="ms-1" pill>Admin</Badge>
                      )}
                    </span>
                  } 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Header>
                    <div className="text-wrap">
                      <strong>{user?.name}</strong>
                      <br />
                      <small className="text-muted">{user?.email}</small>
                      <br />
                      <small className="text-muted">{user?.company}</small>
                    </div>
                  </NavDropdown.Header>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/profile">
                    <i className="fas fa-user me-2"></i>
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/settings">
                    <i className="fas fa-cog me-2"></i>
                    Settings
                  </NavDropdown.Item>
                  {user?.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Item as={Link} to="/admin">
                        <i className="fas fa-shield-alt me-2"></i>
                        Admin Panel
                      </NavDropdown.Item>
                    </>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link 
                as={Link} 
                to="/login"
                className={isActiveRoute('/login') ? activeLinkClass : ''}
              >
                <i className="fas fa-sign-in-alt me-1"></i>
                Login
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/register"
                className={isActiveRoute('/register') ? activeLinkClass : ''}
              >
                <i className="fas fa-user-plus me-1"></i>
                Register
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/about"
                className={isActiveRoute('/about') ? activeLinkClass : ''}
              >
                <i className="fas fa-info-circle me-1"></i>
                About
              </Nav.Link>
            </Nav>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;