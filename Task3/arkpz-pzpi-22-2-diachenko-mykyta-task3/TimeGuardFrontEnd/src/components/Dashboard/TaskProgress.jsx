import React, { useEffect, useState } from 'react';
import apiService from '../../services/apiService';
import { Card, Spinner, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';

const TaskProgress = () => {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskProgress();
  }, []);

  const fetchTaskProgress = async () => {
    try {
      const response = await apiService.getTaskProgress()
      setProgressData(response.data.report);
    } catch (error) {
      console.error('Error fetching task progress:', error);
      toast.error('Failed to load task progress.');
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
        <Card.Title>Task Progress Overview</Card.Title>
        {progressData.map(task => (
          <div key={task.task_id} className="mb-3">
            <strong>{task.task_title}</strong>
            <ProgressBar now={task.progress_percentage} label={`${task.progress_percentage}%`} />
          </div>
        ))}
      </Card.Body>
    </Card>
  );
};

export default TaskProgress;
