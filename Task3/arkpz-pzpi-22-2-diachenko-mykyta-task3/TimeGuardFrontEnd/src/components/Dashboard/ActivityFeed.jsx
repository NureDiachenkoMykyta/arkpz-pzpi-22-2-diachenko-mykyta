import React, { useEffect, useState } from 'react';
import { Card, Spinner, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityFeed();
  }, []);

  const fetchActivityFeed = async () => {
    try {
      const response = await apiService.getActivityFeed();
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      toast.error('Failed to load the activity feed');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours) => {
    return parseFloat(hours).toFixed(2); 
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <Card>
      <Card.Body>
        <Card.Title>Recent Activities</Card.Title>
        {activities.length > 0 ? (
          <ListGroup variant="flush">
            {activities.map((activity, index) => (
              <ListGroup.Item key={index}>
                <strong>{activity.activity_type}:</strong>{' '}
                {activity.detail.includes('hours') ? (
                  activity.detail.replace(/(\d+\.?\d*) hours/, (match, hours) => 
                    `${formatHours(hours)} hours`
                  )
                ) : (
                  activity.detail
                )}
                <br />
                <small className="text-muted">
                  {new Date(activity.timestamp).toLocaleString()}
                </small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p>No recent activities.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default ActivityFeed;
