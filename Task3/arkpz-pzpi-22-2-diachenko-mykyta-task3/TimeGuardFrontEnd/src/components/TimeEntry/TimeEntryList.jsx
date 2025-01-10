import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';
import './TimeEntryList.css';

const TimeEntryList = ({ taskId, fetchTotalTime }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimeEntries();

  }, [taskId]);

  const fetchTimeEntries = async () => {
    try {
      const response = await apiService.getTimeEntries(taskId);
      setTimeEntries(response.data.timeEntries || []);
      setError('');
    } catch (err) {
      console.error('Error fetching time entries:', err);
      const errorMessage = err.response?.data?.error || 'Failed to fetch time entries';
      setError(errorMessage);
      toast.error(`Error fetching time entries: ${errorMessage}`);
    }
  };

  const handleDelete = async (entryId) => {
    try {
      await apiService.deleteTimeEntry(entryId);
      toast.success('Time entry deleted successfully!');
      fetchTimeEntries(); 
      fetchTotalTime(taskId);
    } catch (err) {
      console.error('Error deleting time entry:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete time entry';
      toast.error(`Error deleting time entry: ${errorMessage}`);
    }
  };

  const handleEditEndTimeToNow = async (entry) => {
    try {
      await apiService.editTimeEntry(entry.id, {
        start_time: entry.start_time, 
        end_time: new Date().toISOString(),
      });
      toast.success('Time entry updated successfully!');
      fetchTimeEntries();
      fetchTotalTime(taskId);
    } catch (err) {
      console.error('Error editing time entry:', err);
      const errorMessage = err.response?.data?.error || 'Failed to edit time entry';
      toast.error(`Error editing time entry: ${errorMessage}`);
    }
  };


  const formatDuration = (start, end) => {
    if (!end) return '--';
    const durationSec = (new Date(end) - new Date(start)) / 1000;
    const hours = Math.floor(durationSec / 3600);
    const minutes = Math.floor((durationSec % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="mt-3 time-entry-list">
      <h6>Time Entries</h6>
      {error && <div className="alert alert-danger">{error}</div>}

      {timeEntries.length > 0 ? (
        timeEntries.map((entry) => (
          <div key={entry.id} className="mb-2 border p-2 time-entry-item">
            <p><strong>Start:</strong> {new Date(entry.start_time).toLocaleString()}</p>
            <p><strong>End:</strong> {entry.end_time ? new Date(entry.end_time).toLocaleString() : '—'}</p>
            <p><strong>Duration:</strong> {formatDuration(entry.start_time, entry.end_time)}</p>

            <button
              className="btn btn-danger btn-sm me-2"
              onClick={() => handleDelete(entry.id)}
            >
              Delete
            </button>


            {!entry.end_time && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => handleEditEndTimeToNow(entry)}
              >
                Set End Time = Now
              </button>
            )}
          </div>
        ))
      ) : (
        <p>No time entries found.</p>
      )}
    </div>
  );
};

export default TimeEntryList;
