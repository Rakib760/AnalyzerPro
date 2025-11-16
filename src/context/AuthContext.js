import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Configure axios base URL and interceptors
  useEffect(() => {
    // Set base URL correctly - make sure it includes /api
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    axios.defaults.baseURL = apiUrl;
    
    console.log('🔧 Axios configured with base URL:', axios.defaults.baseURL);

    // Request interceptor to add auth token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['Content-Type'] = 'application/json';
        
        // Log the full URL being requested
        const fullUrl = config.baseURL + (config.url.startsWith('/') ? config.url : '/' + config.url);
        console.log(`🌐 Making ${config.method?.toUpperCase()} request to: ${fullUrl}`);
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        console.log(`✅ Response received from ${response.config.url}:`, response.status);
        return response;
      },
      (error) => {
        console.error('❌ Response interceptor error:', error.response?.status, error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          window.location.href = '/login?message=Session expired. Please login again.';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []); 

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Found token, checking auth status...');
        // ✅ FIXED: Remove leading slash
        const response = await axios.get('auth/me');
        if (response.data.success) {
          setUser(response.data.data);
          console.log('User authenticated:', response.data.data.email);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } else {
        console.log('No token found, user not authenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      console.log('Sending login request to backend...', { 
        email: email.toLowerCase().trim(),
        baseURL: axios.defaults.baseURL
      });
      
      // ✅ FIXED: Remove leading slash
      const response = await axios.post('auth/login', { 
        email: email.toLowerCase().trim(), 
        password 
      });

      console.log('Backend response received:', response.data);

      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        console.log('Token received, storing in localStorage');
        
        localStorage.setItem('token', token);
        
        setUser(userData);
        return { success: true, data: userData };
      } else {
        console.log('Backend returned success: false');
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      
      let message = 'Login failed';
      
      if (error.response) {
        // Server responded with error status
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        console.log('Error response headers:', error.response.headers);
        
        // More specific error messages based on status code
        if (error.response.status === 500) {
          message = 'Server error. Please check if the backend is running properly.';
        } else if (error.response.status === 404) {
          message = 'Login endpoint not found. Please check the server configuration.';
        } else {
          message = error.response.data?.message || 
                    error.response.data?.error || 
                    `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.log('No response received. Request details:', error.request);
        message = 'No response from server. Please check if the backend is running and accessible.';
        
        // Check if it's a CORS issue
        if (error.message && error.message.includes('CORS')) {
          message = 'CORS error: Backend might not be properly configured for frontend requests.';
        }
      } else {
        // Something else happened
        console.log('Error message:', error.message);
        message = error.message;
      }
      
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      
      // ✅ FIXED: Remove leading slash
      const response = await axios.post('auth/register', userData);
      
      if (response.data.success) {
        const { token, ...userInfo } = response.data.data;
        localStorage.setItem('token', token);
        
        setUser(userInfo);
        return { success: true, data: userInfo };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.errors?.join(', ') ||
                     error.message || 
                     'Registration failed. Please check if the server is running.';
      setError(message);
      console.error('Registration error:', error);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    handleLogout();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setError('');
  };

  const updateUserBrands = async (brands) => {
    try {
      // ✅ FIXED: Remove leading slash
      const response = await axios.put('auth/brands', { brands });
      
      if (response.data.success) {
        setUser(prev => ({ 
          ...prev, 
          brands: response.data.data.brands,
          activeBrandsCount: response.data.data.activeBrandsCount 
        }));
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Failed to update brands');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update brands';
      return { success: false, message };
    }
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
    updateUserBrands,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};