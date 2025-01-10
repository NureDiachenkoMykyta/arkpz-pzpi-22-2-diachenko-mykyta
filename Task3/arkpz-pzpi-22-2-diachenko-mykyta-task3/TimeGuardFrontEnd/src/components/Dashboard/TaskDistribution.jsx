import React, { useEffect, useState } from 'react';
import apiService from '../../services/apiService';
import { Card, Spinner } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';

ChartJS.register(ArcElement, Tooltip, Legend);

const TaskDistribution = () => {
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskDistribution();
  }, []);

  const fetchTaskDistribution = async () => {
    try {
      const response = await apiService.getTaskDistribution()
      const rawData = response.data.report;

      const labels = rawData.map(entry => entry.status);
      const counts = rawData.map(entry => entry.count);

      const data = {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
            hoverBackgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      };

      setDistributionData(data);
    } catch (error) {
      console.error('Error fetching task distribution:', error);
      toast.error('Failed to load the task distribution.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (!distributionData) {
    return <p>No data available.</p>;
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Task Distribution by Status</Card.Title>
        <Pie data={distributionData} />
      </Card.Body>
    </Card>
  );
};

export default TaskDistribution;
