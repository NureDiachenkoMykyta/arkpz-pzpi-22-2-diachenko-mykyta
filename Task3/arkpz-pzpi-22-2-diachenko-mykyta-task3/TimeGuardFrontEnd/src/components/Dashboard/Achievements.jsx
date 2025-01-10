import React, { useEffect, useState } from 'react';
import { Card, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {

      const response = await apiService.getAchievements();
      setAchievements(response.data.achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements.');
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
        <Card.Title>Achievements</Card.Title>
        <div className="d-flex flex-wrap">
          {achievements.length > 0 ? (
            achievements.map((ach) => (
              <Badge
                key={ach.id}
                bg="info"
                className="m-1 p-3"
                style={{ minWidth: '150px' }}
              >
                <h6>{ach.name}</h6>
                <p>{ach.description}</p>
              </Badge>
            ))
          ) : (
            <p>No achievements yet.</p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default Achievements;
