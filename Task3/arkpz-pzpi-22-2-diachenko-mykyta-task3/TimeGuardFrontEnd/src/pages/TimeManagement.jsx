import React, { useState } from 'react';
import apiService from '../services/apiService';

const TimeManagement = () => {
  const [manualTime, setManualTime] = useState('');
  const handleManualTimeSubmit = async () => {
    const response = await apiService.createTimeEntry({
      task_id: 'sample-task-id', // Replace with actual task ID
      start_time: new Date().toISOString(),
      end_time: new Date(new Date().getTime() + 3600000).toISOString(),
    });
    console.log('Manual time added:', response.data);
    setManualTime('');
  };

  return (
    <div className="container mt-4">
    </div>
  );
};

export default TimeManagement;
