import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Badge } from 'react-bootstrap';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
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
  Filler // Add this import
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
  Filler // Register the Filler plugin
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [brandPerformance, setBrandPerformance] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalyticsData();
    fetchBrandPerformance();
  }, [timeRange, selectedBrand]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        period: timeRange,
        ...(selectedBrand !== 'all' && { brand: selectedBrand })
      });

      // FIXED: Remove the duplicate /api from the URL
      const response = await axios.get(`/dashboard/overview?${params}`);

      if (response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 404) {
        setError('Analytics endpoint not found. Please check if the dashboard routes are set up.');
      } else {
        setError('Error loading analytics data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandPerformance = async () => {
    try {
      const params = new URLSearchParams({ period: timeRange });

      // FIXED: Remove the duplicate /api from the URL
      const response = await axios.get(`/dashboard/brands/performance?${params}`);

      if (response.data.success) {
        setBrandPerformance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching brand performance:', error);
    }
  };

  // Sentiment distribution data for doughnut chart
  const sentimentData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          analyticsData?.sentiment?.positive?.count || 0,
          analyticsData?.sentiment?.neutral?.count || 0,
          analyticsData?.sentiment?.negative?.count || 0,
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
        borderColor: ['#45a049', '#e68900', '#d32f2f'],
        borderWidth: 2,
      },
    ],
  };

  // Source distribution data for bar chart
  const sourceData = {
    labels: analyticsData?.sources?.map(source => source.source) || [],
    datasets: [
      {
        label: 'Mentions',
        data: analyticsData?.sources?.map(source => source.count) || [],
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
        borderWidth: 2,
      },
    ],
  };

  // Timeline data for line chart
  const timelineData = {
    labels: analyticsData?.timeline?.map(item => {
      if (timeRange === '24h') {
        return new Date(item._id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return new Date(item._id).toLocaleDateString();
    }) || [],
    datasets: [
      {
        label: 'Total Mentions',
        data: analyticsData?.timeline?.map(item => item.count) || [],
        borderColor: '#9C27B0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Positive',
        data: analyticsData?.timeline?.map(item => item.positive) || [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Negative',
        data: analyticsData?.timeline?.map(item => item.negative) || [],
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Brand comparison data
  const brandComparisonData = {
    labels: brandPerformance?.map(brand => brand.brand) || [],
    datasets: [
      {
        label: 'Total Mentions',
        data: brandPerformance?.map(brand => brand.totalMentions) || [],
        backgroundColor: 'rgba(33, 150, 243, 0.8)',
      },
      {
        label: 'Positive',
        data: brandPerformance?.map(brand => brand.positiveMentions) || [],
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
      },
      {
        label: 'Negative',
        data: brandPerformance?.map(brand => brand.negativeMentions) || [],
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
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
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [3, 3],
        },
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

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading analytics...</span>
          </div>
          <p className="mt-3 text-muted">Loading analytics data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1">Analytics & Insights</h1>
              <p className="text-muted mb-0">
                Comprehensive analysis of your brand mentions across different platforms
              </p>
            </div>
            <Badge bg="light" text="dark" className="fs-6">
              <i className="fas fa-chart-line me-1"></i>
              Real-time Data
            </Badge>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Time Range</Form.Label>
                <Form.Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 3 Months</option>
                  <option value="1y">Last Year</option>
                </Form.Select>
              </Form.Group>
            </Col>
         // Replace the entire brand filter section with this:
<Col md={3}>
  <Form.Group>
    <Form.Label className="fw-semibold">Filter by Brand</Form.Label>
    <Form.Select
      value={selectedBrand}
      onChange={(e) => setSelectedBrand(e.target.value)}
    >
      <option value="all">All Brands</option>
      {user?.brands?.map((brand, index) => {
        // Safely extract brand name whether it's a string or object
        let brandName, brandValue;
        
        if (typeof brand === 'string') {
          brandName = brand;
          brandValue = brand;
        } else if (brand && typeof brand === 'object') {
          brandName = brand.name || `Brand ${index + 1}`;
          brandValue = brand.name || `brand_${index + 1}`;
        } else {
          brandName = `Brand ${index + 1}`;
          brandValue = `brand_${index + 1}`;
        }
        
        return (
          <option key={brandValue} value={brandValue}>
            {brandName}
          </option>
        );
      })}
    </Form.Select>
  </Form.Group>
</Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Data Refresh</Form.Label>
                <div>
                  <Button 
                    variant="outline-primary" 
                    onClick={fetchAnalyticsData}
                    className="w-100"
                  >
                    <i className="fas fa-refresh me-2"></i>
                    Refresh Data
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Export</Form.Label>
                <div>
                  <Button 
                    variant="outline-success" 
                    className="w-100"
                    onClick={() => {/* Add export functionality */}}
                  >
                    <i className="fas fa-download me-2"></i>
                    Export Report
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {!analyticsData && !loading && (
        <Alert variant="info" className="mb-4">
          <i className="fas fa-info-circle me-2"></i>
          No analytics data available. Start by collecting some mentions from the Dashboard.
        </Alert>
      )}

      {/* Summary Cards */}
      {analyticsData && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-primary mb-2">
                  <i className="fas fa-comment-alt fa-2x"></i>
                </div>
                <h3 className="text-primary mb-1">
                  {analyticsData.summary?.periodMentions || 0}
                </h3>
                <p className="text-muted mb-1">Current Period</p>
                {analyticsData.summary?.growthPercentage !== undefined && (
                  <small className={analyticsData.summary.growthPercentage >= 0 ? 'text-success' : 'text-danger'}>
                    <i className={`fas fa-arrow-${analyticsData.summary.growthPercentage >= 0 ? 'up' : 'down'} me-1`}></i>
                    {Math.abs(analyticsData.summary.growthPercentage)}% from previous period
                  </small>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-success mb-2">
                  <i className="fas fa-thumbs-up fa-2x"></i>
                </div>
                <h3 className="text-success mb-1">
                  {analyticsData.sentiment?.positive?.count || 0}
                </h3>
                <p className="text-muted mb-1">Positive Mentions</p>
                <small className="text-muted">
                  {analyticsData.sentiment?.positive?.percentage || 0}% of total
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-danger mb-2">
                  <i className="fas fa-thumbs-down fa-2x"></i>
                </div>
                <h3 className="text-danger mb-1">
                  {analyticsData.sentiment?.negative?.count || 0}
                </h3>
                <p className="text-muted mb-1">Negative Mentions</p>
                <small className="text-muted">
                  {analyticsData.sentiment?.negative?.percentage || 0}% of total
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-warning mb-2">
                  <i className="fas fa-chart-line fa-2x"></i>
                </div>
                <h3 className="text-warning mb-1">
                  {analyticsData.engagement?.totalEngagement || 0}
                </h3>
                <p className="text-muted mb-1">Total Engagement</p>
                <small className="text-muted">
                  Avg: {analyticsData.engagement?.avgEngagement?.toFixed(1) || 0} per mention
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      {analyticsData && (
        <>
          <Row className="mb-4">
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-transparent">
                  <h5 className="mb-0">Sentiment Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Doughnut data={sentimentData} options={doughnutOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-transparent">
                  <h5 className="mb-0">Mentions Over Time</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Line data={timelineData} options={chartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-transparent">
                  <h5 className="mb-0">Mentions by Source</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Bar data={sourceData} options={chartOptions} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header className="bg-transparent">
                  <h5 className="mb-0">Brand Performance Comparison</h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Bar 
                      data={brandComparisonData} 
                      options={{
                        ...chartOptions,
                        scales: {
                          x: {
                            stacked: true,
                          },
                          y: {
                            stacked: true,
                          },
                        },
                      }} 
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Brand Performance Table */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header className="bg-transparent">
                  <h5 className="mb-0">Brand Performance Details</h5>
                </Card.Header>
                <Card.Body>
                  {brandPerformance.length > 0 ? (
                    <Table responsive striped hover>
                      <thead className="table-light">
                        <tr>
                          <th>Brand</th>
                          <th>Total Mentions</th>
                          <th>Positive</th>
                          <th>Negative</th>
                          <th>Neutral</th>
                          <th>Avg Sentiment</th>
                          <th>Engagement Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brandPerformance.map((brand, index) => (
                          <tr key={brand.brand || index}>
                            <td>
                              <strong>{brand.brand}</strong>
                            </td>
                            <td>{brand.totalMentions}</td>
                            <td className="text-success">
                              {brand.positiveMentions} ({brand.sentimentDistribution?.positive || 0}%)
                            </td>
                            <td className="text-danger">
                              {brand.negativeMentions} ({brand.sentimentDistribution?.negative || 0}%)
                            </td>
                            <td className="text-warning">
                              {brand.neutralMentions} ({brand.sentimentDistribution?.neutral || 0}%)
                            </td>
                            <td>
                              <Badge 
                                bg={getSentimentVariantFromScore(brand.avgSentimentScore)} 
                                className="fs-6"
                              >
                                {brand.avgSentimentScore?.toFixed(2) || '0.00'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="info" className="fs-6">
                                {brand.avgEngagement?.toFixed(1) || '0.0'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-muted text-center py-3">No brand performance data available</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Spike Alerts */}
          {analyticsData.spikes && analyticsData.spikes.length > 0 && (
            <Row className="mb-4">
              <Col>
                <Card className="border-warning">
                  <Card.Header className="bg-warning bg-opacity-10">
                    <h5 className="mb-0 text-warning">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Recent Spike Alerts
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive size="sm">
                      <thead>
                        <tr>
                          <th>Brand</th>
                          <th>Source</th>
                          <th>Sentiment</th>
                          <th>Content Preview</th>
                          <th>Time</th>
                          <th>Engagement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.spikes.slice(0, 5).map((spike, index) => (
                          <tr key={index}>
                            <td>
                              <Badge bg="secondary">{spike.brand}</Badge>
                            </td>
                            <td>
                              <Badge bg="primary">{spike.source}</Badge>
                            </td>
                            <td>
                              <Badge bg={getSentimentVariant(spike.sentiment)}>
                                {spike.sentiment}
                              </Badge>
                            </td>
                            <td className="text-truncate" style={{ maxWidth: '200px' }}>
                              {spike.content}
                            </td>
                            <td>
                              {new Date(spike.timestamp).toLocaleDateString()}
                            </td>
                            <td>
                              {spike.engagement?.total || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
};

const getSentimentVariant = (sentiment) => {
  const variants = {
    positive: 'success',
    negative: 'danger',
    neutral: 'warning',
  };
  return variants[sentiment] || 'secondary';
};

const getSentimentVariantFromScore = (score) => {
  if (score > 0.2) return 'success';
  if (score < -0.2) return 'danger';
  return 'warning';
};

export default Analytics;