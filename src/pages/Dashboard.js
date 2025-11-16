import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler // Make sure this is imported
} from 'chart.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Register all required plugins including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler // Make sure this is registered
);

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recentMentions, setRecentMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [collectionResult, setCollectionResult] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [overviewRes, mentionsRes] = await Promise.all([
        axios.get('/dashboard/overview?period=24h'),
        axios.get('/mentions?limit=8&sortBy=timestamp&sortOrder=desc'),
      ]);

      if (overviewRes.data.success) {
        setOverview(overviewRes.data.data);
      }
      
      if (mentionsRes.data.success) {
        setRecentMentions(mentionsRes.data.data.mentions);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 404) {
        console.log('API endpoint not found. Please check if the routes are set up.');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerCollection = async () => {
    try {
      setCollecting(true);
      setCollectionResult(null);
      
      const response = await axios.post('/mentions/collect', {});

      if (response.data.success) {
        setCollectionResult({
          success: true,
          message: response.data.message,
          data: response.data.data
        });
        setTimeout(() => {
          fetchDashboardData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error triggering collection:', error);
      setCollectionResult({
        success: false,
        message: error.response?.data?.message || 'Collection failed'
      });
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      </Container>
    );
  }

  // Sentiment distribution data
  const sentimentData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          overview?.sentiment?.positive?.count || 0,
          overview?.sentiment?.neutral?.count || 0,
          overview?.sentiment?.negative?.count || 0,
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
        borderColor: ['#45a049', '#e68900', '#d32f2f'],
        borderWidth: 2,
      },
    ],
  };

  // Source distribution data
  const sourceData = {
    labels: overview?.sources?.map(source => source.source) || [],
    datasets: [
      {
        label: 'Mentions',
        data: overview?.sources?.map(source => source.count) || [],
        backgroundColor: [
          '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#607D8B'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Timeline data for mentions over time
  const timelineData = {
    labels: overview?.timeline?.map(item => {
      const date = new Date(item._id);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }) || [],
    datasets: [
      {
        label: 'Mentions',
        data: overview?.timeline?.map(item => item.count) || [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <Container fluid className="mt-4">
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h1 className="h2 mb-1">Brand Mention Dashboard</h1>
              <p className="text-muted mb-0">
                Monitor and analyze your brand mentions in real-time
              </p>
            </div>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <Button 
                variant="outline-primary" 
                onClick={fetchDashboardData}
                disabled={collecting}
              >
                <i className="fas fa-refresh me-2"></i>
                Refresh
              </Button>
              <Button 
                variant="primary" 
                onClick={triggerCollection}
                disabled={collecting}
              >
                {collecting ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Collecting...</span>
                    </div>
                    Collecting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search me-2"></i>
                    Collect New Mentions
                  </>
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Collection Result Alert */}
      {collectionResult && (
        <Row className="mb-4">
          <Col>
            <Alert variant={collectionResult.success ? 'success' : 'danger'}>
              <i className={`fas fa-${collectionResult.success ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
              {collectionResult.message}
              {collectionResult.data && (
                <div className="mt-2 small">
                  <strong>Results:</strong> {collectionResult.data.newMentions} new mentions collected 
                  from {collectionResult.data.brands?.length || 0} brands in {collectionResult.data.duration}ms
                </div>
              )}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Trial Status Alert */}
      {user?.isTrialActive && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" className="d-flex align-items-center">
              <i className="fas fa-clock me-2 fs-4"></i>
              <div className="flex-grow-1">
                <strong>Trial Period Active</strong> - {user.trialDaysLeft} days remaining
                <ProgressBar 
                  variant="warning" 
                  now={(user.trialDaysLeft / 14) * 100} 
                  className="mt-2" 
                  style={{ height: '6px' }}
                />
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col xl={3} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Total Mentions</h6>
                  <h2 className="mb-0">{overview?.summary?.totalMentions || 0}</h2>
                  <small className="text-muted">All time</small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-comment-alt text-primary fa-lg"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Last 24 Hours</h6>
                  <h2 className="mb-0">{overview?.summary?.periodMentions || 0}</h2>
                  {overview?.summary?.growthPercentage !== undefined && (
                    <small className={overview.summary.growthPercentage >= 0 ? 'text-success' : 'text-danger'}>
                      <i className={`fas fa-arrow-${overview.summary.growthPercentage >= 0 ? 'up' : 'down'} me-1`}></i>
                      {Math.abs(overview.summary.growthPercentage)}% from previous period
                    </small>
                  )}
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-chart-line text-success fa-lg"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Positive Sentiment</h6>
                  <h2 className="text-success mb-0">
                    {overview?.sentiment?.positive?.count || 0}
                  </h2>
                  <small className="text-muted">
                    {overview?.sentiment?.positive?.percentage || 0}% of total
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-thumbs-up text-success fa-lg"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title text-muted mb-2">Negative Sentiment</h6>
                  <h2 className="text-danger mb-0">
                    {overview?.sentiment?.negative?.count || 0}
                  </h2>
                  <small className="text-muted">
                    {overview?.sentiment?.negative?.percentage || 0}% of total
                  </small>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <i className="fas fa-thumbs-down text-danger fa-lg"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="mb-4">
        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Sentiment Distribution</h5>
              <Badge bg="light" text="dark">
                {overview?.summary?.periodMentions || 0} total
              </Badge>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '250px' }}>
                <Doughnut data={sentimentData} options={doughnutOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Mentions by Source</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '250px' }}>
                <Bar data={sourceData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Mentions Timeline (24h)</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '250px' }}>
                <Line data={timelineData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Mentions & Top Brands */}
      <Row className="mb-4">
        <Col lg={8} className="mb-3">
          <Card className="h-100">
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Mentions</h5>
              <Button variant="outline-primary" size="sm" as="a" href="/mentions">
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {recentMentions.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  No mentions found. Try collecting some mentions to get started!
                </Alert>
              ) : (
                <div className="list-group list-group-flush">
                  {recentMentions.map(mention => (
                    <div key={mention._id} className="list-group-item px-0 py-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="secondary" className="fs-6">
                            {mention.brand}
                          </Badge>
                          <Badge bg={getSourceVariant(mention.source)} className="fs-6">
                            {mention.source}
                          </Badge>
                          <Badge bg={getSentimentVariant(mention.sentiment)} className="fs-6">
                            {mention.sentiment}
                          </Badge>
                        </div>
                        <small className="text-muted">
                          {new Date(mention.timestamp).toLocaleDateString()} at{' '}
                          {new Date(mention.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </small>
                      </div>
                      <p className="mb-2 text-break">{mention.content}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Engagement: {mention.engagement?.total || 0} 
                          {mention.engagement?.likes > 0 && ` • ${mention.engagement.likes} likes`}
                          {mention.engagement?.comments > 0 && ` • ${mention.engagement.comments} comments`}
                        </small>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          as="a" 
                          href={mention.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fas fa-external-link-alt me-1"></i>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Top Brands</h5>
            </Card.Header>
            <Card.Body>
              {overview?.topBrands && overview.topBrands.length > 0 ? (
                <div className="list-group list-group-flush">
                  {overview.topBrands.slice(0, 5).map((brand, index) => (
                    <div key={brand._id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <span className="fw-bold text-primary me-2">{index + 1}.</span>
                        <span className="fw-semibold">{brand._id}</span>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">{brand.count} mentions</div>
                        <small className="text-muted">
                          {brand.positive && <span className="text-success">{brand.positive} positive</span>}
                          {brand.negative && <span className="text-danger ms-2">{brand.negative} negative</span>}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-3">No brand data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-transparent">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={3} sm={6}>
                  <Button variant="outline-primary" className="w-100 h-100 py-3" as="a" href="/mentions">
                    <i className="fas fa-comment-alt fa-2x mb-2 d-block"></i>
                    View All Mentions
                  </Button>
                </Col>
                <Col md={3} sm={6}>
                  <Button variant="outline-success" className="w-100 h-100 py-3" as="a" href="/analytics">
                    <i className="fas fa-chart-bar fa-2x mb-2 d-block"></i>
                    Advanced Analytics
                  </Button>
                </Col>
                <Col md={3} sm={6}>
                  <Button variant="outline-info" className="w-100 h-100 py-3" as="a" href="/sources">
                    <i className="fas fa-plug fa-2x mb-2 d-block"></i>
                    Data Sources
                  </Button>
                </Col>
                <Col md={3} sm={6}>
                  <Button variant="outline-warning" className="w-100 h-100 py-3" as="a" href="/settings">
                    <i className="fas fa-cog fa-2x mb-2 d-block"></i>
                    Settings
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

const getSourceVariant = (source) => {
  const variants = {
    twitter: 'info',
    reddit: 'warning',
    news: 'success',
    blog: 'primary',
    forum: 'secondary',
    instagram: 'danger',
    facebook: 'primary',
    youtube: 'danger',
  };
  return variants[source] || 'secondary';
};

const getSentimentVariant = (sentiment) => {
  const variants = {
    positive: 'success',
    negative: 'danger',
    neutral: 'warning',
  };
  return variants[sentiment] || 'secondary';
};

export default Dashboard;