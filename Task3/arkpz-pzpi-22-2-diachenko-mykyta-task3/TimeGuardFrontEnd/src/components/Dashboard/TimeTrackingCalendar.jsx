import React, { useEffect, useState } from 'react';
import apiService from '../../services/apiService';
import { Card, Spinner, Form } from 'react-bootstrap';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; 
import { toast } from 'react-toastify';

const TimeTrackingCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30); 

  useEffect(() => {
    fetchTimeEntries();
  }, [days]);

  const fetchTimeEntries = async () => {
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - days);

      const response = await apiService.getTimeEntriesCalendar(pastDate.toISOString(), today.toISOString())

      setEvents(response.data.report);
    } catch (error) {
      console.error('Error fetching time entries for calendar:', error);
      toast.error('Failed to load the time entries for the calendar.');
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
        <Card.Title>Time Tracking Calendar</Card.Title>
        <Form.Group controlId="daysAhead" className="mb-3">
          <Form.Label>Days Back:</Form.Label>
          <Form.Control
            type="number"
            value={days}
            onChange={handleDaysChange}
            min="1"
            placeholder="Enter number of days"
          />
        </Form.Group>
        <FullCalendar
          plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
        />
      </Card.Body>
    </Card>
  );
};

export default TimeTrackingCalendar;
