import React, { useEffect, useState } from 'react';
import apiService from '../../services/apiService';
import { Card, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await apiService.getPerformanceMetrics()
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      toast.error('Failed to load performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Performance Metrics</Card.Title>
        <Card.Text>
          <strong>Total Tasks:</strong> {metrics.total_tasks}<br />
          <strong>Completed Tasks:</strong> {metrics.completed_tasks}<br />
          <strong>Average Time per Task (hrs):</strong> {metrics.average_time_hours}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default PerformanceMetrics;
