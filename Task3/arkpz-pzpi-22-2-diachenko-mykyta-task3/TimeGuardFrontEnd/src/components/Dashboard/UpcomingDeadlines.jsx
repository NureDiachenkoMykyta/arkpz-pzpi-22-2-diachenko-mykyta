import React, { useEffect, useState } from 'react';
import apiService from '../../services/apiService';
import { Card, Spinner, Form, ListGroup, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

const UpcomingDeadlines = () => {
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7); 
  useEffect(() => {
    fetchUpcomingDeadlines();
  }, [days]);

  const fetchUpcomingDeadlines = async () => {
    try {
      const response = await apiService.getUpcomingDeadlines(days)
      setUpcomingTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      toast.error('Failed to upload upcoming deadlines.');
    } finally {
      setLoading(false);
    }
  };

  const handleDaysChange = (e) => {
    setDays(e.target.value);
    setLoading(true);
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Upcoming Deadlines</Card.Title>
        <Form.Group controlId="daysAhead" className="mb-3">
          <Form.Label>Days Ahead:</Form.Label>
          <Form.Control
            type="number"
            value={days}
            onChange={handleDaysChange}
            min="1"
            placeholder="Enter number of days"
          />
        </Form.Group>
        {upcomingTasks.length > 0 ? (
          <ListGroup>
            {upcomingTasks.map(task => (
              <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{task.title}</strong> - {new Date(task.due_date).toLocaleDateString()}
                </div>
                <Badge bg={task.status === 'Completed' ? 'success' : 'warning'}>
                  {task.status}
                </Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p>No upcoming deadlines.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default UpcomingDeadlines;
