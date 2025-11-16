import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import axios from 'axios';

const Mentions = () => {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '',
    sentiment: '',
    source: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchMentions();
  }, [filters]);

  // ✅ REPLACE YOUR EXISTING fetchMentions FUNCTION WITH THIS ONE:
  const fetchMentions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔐 Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        setMentions([]);
        setLoading(false);
        return;
      }

      // Clean up filters - remove empty values
      const cleanFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          cleanFilters[key] = value;
        }
      });

      console.log('📤 Sending request with filters:', cleanFilters);

      // FIXED: Remove the leading slash or use the correct base URL
      const response = await axios.get('api/mentions', {  // Remove leading slash
        params: cleanFilters,
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📥 API Response:', response.data);

      // Correct response structure
      if (response.data.success && response.data.data) {
        setMentions(response.data.data.mentions || []);
        console.log(`✅ Loaded ${response.data.data.mentions?.length || 0} mentions`);
      } else {
        console.error('❌ Unexpected response structure:', response.data);
        setMentions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching mentions:', error);
      if (error.response) {
        console.error('📊 Response status:', error.response.status);
        console.error('📊 Response data:', error.response.data);
        
        if (error.response.status === 401) {
          console.error('🔐 Authentication failed');
          localStorage.removeItem('token');
        }
      }
      setMentions([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep all your other functions the same:
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getSentimentVariant = (sentiment) => {
    const variants = {
      positive: 'success',
      negative: 'danger',
      neutral: 'warning',
    };
    return variants[sentiment] || 'secondary';
  };

  const getSourceVariant = (source) => {
    const variants = {
      twitter: 'info',
      reddit: 'warning',
      news: 'success',
      blog: 'primary',
      forum: 'dark',
    };
    return variants[source] || 'secondary';
  };



  // Add a test button to debug
  const testConnection = async () => {
    console.log('Testing API connection...');
    await fetchMentions();
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1>Brand Mentions</h1>
          {/* Debug button - remove in production */}
          <Button 
            variant="outline-info" 
            size="sm" 
            onClick={testConnection}
            className="mb-2"
          >
            Test API Connection
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Brand</Form.Label>
            <Form.Select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="">All Brands</option>
              <option value="Nike">Nike</option>
              <option value="Apple">Apple</option>
              <option value="Google">Google</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Sentiment</Form.Label>
            <Form.Select
              value={filters.sentiment}
              onChange={(e) => handleFilterChange('sentiment', e.target.value)}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Source</Form.Label>
            <Form.Select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <option value="">All Sources</option>
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
              <option value="news">News</option>
              <option value="blog">Blog</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button variant="outline-secondary" onClick={() => setFilters({ brand: '', sentiment: '', source: '', page: 1, limit: 20 })}>
            Clear Filters
          </Button>
        </Col>
      </Row>

      {/* Mentions List */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">All Mentions ({mentions.length})</h5>
            </Card.Header>
            <Card.Body>
              {mentions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No mentions found matching your filters.</p>
                  <Button variant="primary" onClick={fetchMentions}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="mention-list">
                  {mentions.map(mention => (
                    <div key={mention._id} className="border-bottom pb-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <Badge bg="secondary" className="me-2">{mention.brand}</Badge>
                          <Badge bg={getSourceVariant(mention.source)} className="me-2">
                            {mention.source}
                          </Badge>
                          <Badge bg={getSentimentVariant(mention.sentiment)}>
                            {mention.sentiment}
                          </Badge>
                        </div>
                        <small className="text-muted">
                          {new Date(mention.timestamp).toLocaleString()}
                        </small>
                      </div>
                      <p className="mb-2">{mention.content}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          By {mention.author} 
                          {mention.engagement && (
                            <span className="ms-2">
                              👍 {mention.engagement.likes} | 🔄 {mention.engagement.shares} | 💬 {mention.engagement.comments}
                            </span>
                          )}
                        </small>
                        {/* FIXED: Changed sourceUrl to url to match backend data */}
                        <a 
                          href={mention.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          View Original
                        </a>
                      </div>
                      {mention.topics && mention.topics.length > 0 && (
                        <div className="mt-2">
                          {mention.topics.map(topic => (
                            <Badge key={topic} bg="light" text="dark" className="me-1">
                              #{topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Mentions;