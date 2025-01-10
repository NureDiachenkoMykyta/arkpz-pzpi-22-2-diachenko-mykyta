import React, { useState } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/apiService';
import TimeEntryList from '../TimeEntry/TimeEntryList';
import TimeEntryForm from '../TimeEntry/TimeEntryForm';
import './TaskItem.css';

const TaskItem = ({
  task,
  friends,
  totalTime,
  onRefresh,
  onTaskDeleted,
  onEditTask,
  fetchTotalTime
}) => {
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
  const [showTimeEntries, setShowTimeEntries] = useState(false);

  const handleDeleteTask = async () => {
    try {
      await apiService.deleteTask(task.id);
      onTaskDeleted();
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete task';
      toast.error(`Error deleting task: ${errorMessage}`);
    }
  };

  const handleStartTimer = async () => {
    try {
      await apiService.startTimer(task.id);
      await fetchTotalTime(task.id);
      onRefresh();
      toast.success('Timer started successfully!');
    } catch (error) {
      console.error('Error starting timer:', error.response || error.message);
      const errorMessage = error.response?.data?.error || 'Failed to start timer';
      toast.error(`Error starting timer: ${errorMessage}`);
    }
  };

  const handleStopTimer = async () => {
    try {
      await apiService.stopTimer(task.id);
      await fetchTotalTime(task.id);
      onRefresh();
      toast.success('Timer stopped successfully!');
    } catch (error) {
      console.error('Error stopping timer:', error.response || error.message);
      const errorMessage = error.response?.data?.error || 'Failed to stop timer';
      toast.error(`Error stopping timer: ${errorMessage}`);
    }
  };

  return (
    <div className="border p-3 mb-3 task-item">
      <h5>{task.title}</h5>
      <p>{task.description}</p>
      <p>
        <strong>Priority:</strong> {task.priority}
      </p>
      <p>
        <strong>Status:</strong> {task.status}
      </p>
      <p>
        <strong>Due Date:</strong>{' '}
        {new Date(task.due_date).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}
      </p>
      <p>
        <strong>Assigned To:</strong>{' '}
        {friends.find((f) => f.id === task.assignee_id)?.name || 'Me'}
      </p>
      <p>
        <strong>Total Time Spent:</strong> {formatTime(totalTime)}
      </p>

      <div className="action-buttons mb-2">
        <button
          className="btn btn-warning me-2"
          onClick={() => onEditTask(task)}
        >
          Edit
        </button>
        <button className="btn btn-danger me-2" onClick={handleDeleteTask}>
          Delete
        </button>
      </div>

      <div className="timer-controls mb-2">
        <button className="btn btn-success me-2" onClick={handleStartTimer}>
          Start
        </button>
        <button className="btn btn-secondary me-2" onClick={handleStopTimer}>
          Stop
        </button>
      </div>

      <div className="action-buttons mb-2">
        <button
          className="btn btn-primary me-2"
          onClick={() => setShowTimeEntryForm(!showTimeEntryForm)}
        >
          {showTimeEntryForm ? 'Close Time Entry Form' : 'Add Time Entry'}
        </button>

        <button
          className="btn btn-info"
          onClick={() => setShowTimeEntries(!showTimeEntries)}
        >
          {showTimeEntries ? 'Hide Time Entries' : 'View Time Entries'}
        </button>
      </div>

      {showTimeEntryForm && (
        <TimeEntryForm
          taskId={task.id}
          onClose={() => setShowTimeEntryForm(false)}
          onRefresh={() => {
            onRefresh();
          }}
        />
      )}

      {showTimeEntries && (
        <TimeEntryList 
          taskId={task.id}
          fetchTotalTime={fetchTotalTime}
        />
      )}
    </div>
  );
};

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default TaskItem;
