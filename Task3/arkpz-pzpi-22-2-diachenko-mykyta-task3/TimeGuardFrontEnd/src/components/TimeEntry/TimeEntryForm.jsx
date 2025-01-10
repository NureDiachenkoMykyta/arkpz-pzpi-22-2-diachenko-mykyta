import React, { useState } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';
import './TimeEntryForm.css';

const TimeEntryForm = ({ taskId, onClose, onRefresh }) => {
  const [timeEntryData, setTimeEntryData] = useState({
    start_time: '',
    end_time: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setTimeEntryData({
      ...timeEntryData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: '',
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const { start_time, end_time } = timeEntryData;

    if (!start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (end_time) {
      if (new Date(end_time) <= new Date(start_time)) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTimeEntry = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    try {
      await apiService.createTimeEntry({
        task_id: taskId,
        start_time: timeEntryData.start_time,
        end_time: timeEntryData.end_time || null,
      });
      toast.success('Time entry added successfully!');
      onClose();
      onRefresh();
    } catch (err) {
      console.error('Error adding time entry:', err);
      const errorMessage = err.response?.data?.error || 'Failed to add time entry';
      toast.error(`Error adding time entry: ${errorMessage}`);
    }
  };

  return (
    <div className="mt-3 time-entry-form">
      <h6>Add Time Entry</h6>

      <div className="mb-2">
        <label>Start Time:</label>
        <input
          type="datetime-local"
          name="start_time"
          className={`form-control ${errors.start_time ? 'is-invalid' : ''}`}
          value={timeEntryData.start_time}
          onChange={handleChange}
        />
        {errors.start_time && <div className="invalid-feedback">{errors.start_time}</div>}
      </div>

      <div className="mb-2">
        <label>End Time:</label>
        <input
          type="datetime-local"
          name="end_time"
          className={`form-control ${errors.end_time ? 'is-invalid' : ''}`}
          value={timeEntryData.end_time}
          onChange={handleChange}
        />
        {errors.end_time && <div className="invalid-feedback">{errors.end_time}</div>}
      </div>

      <button className="btn btn-success me-2" onClick={handleAddTimeEntry}>
        Save Time Entry
      </button>
      <button className="btn btn-secondary" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
};

export default TimeEntryForm;
