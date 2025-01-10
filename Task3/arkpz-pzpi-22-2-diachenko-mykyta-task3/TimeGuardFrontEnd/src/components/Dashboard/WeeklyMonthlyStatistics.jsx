import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const WeeklyMonthlyStatistics = ({ reportType }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const titleMap = {
    weekly_statistics: 'Weekly Statistics',
    monthly_statistics: 'Monthly Statistics',
  };

  useEffect(() => {
    fetchStatistics();
  }, [reportType]);

  const fetchStatistics = async () => {
    try {
      const response = await apiService.generateReport(reportType);
      const rawData = response.data.report;

      const labels = rawData.map((entry) =>
        reportType === 'weekly_statistics'
          ? new Date(entry.week).toLocaleDateString()
          : new Date(entry.month).toLocaleDateString('default', {
              month: 'long',
              year: 'numeric',
            })
      );
      const totalHours = rawData.map((entry) => parseFloat(entry.total_hours) || 0);
      const tasksCompleted = rawData.map((entry) => parseInt(entry.tasks_completed) || 0);

      const data = {
        labels,
        datasets: [
          {
            label: 'Total Hours',
            data: totalHours,
            backgroundColor: 'rgba(75,192,192,0.6)',
          },
          {
            label: 'Tasks Completed',
            data: tasksCompleted,
            backgroundColor: 'rgba(153,102,255,0.6)',
          },
        ],
      };

      setChartData(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  if (!chartData) {
    return <p>No data available.</p>;
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>{titleMap[reportType]}</Card.Title>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: {
                display: true,
                text: titleMap[reportType],
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </Card.Body>
    </Card>
  );
};

export default WeeklyMonthlyStatistics;
