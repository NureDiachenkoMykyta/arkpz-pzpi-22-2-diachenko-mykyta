import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const TaskForm = ({
  friends,
  editingTask,
  setEditingTask,
  onTaskAdded,
  onTaskSaved,
}) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    status: 'Pending',
    due_date: '',
    assignee_id: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingTask) {
      setTaskData({
        ...editingTask,
        due_date: new Date(editingTask.due_date)
          .toLocaleString('sv-SE', { timeZone: 'UTC' })
          .replace(' ', 'T'),
      });
    } else {
      setTaskData({
        title: '',
        description: '',
        priority: 'Low',
        status: 'Pending',
        due_date: '',
        assignee_id: ''
      });
    }
  }, [editingTask]);

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.title || data.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    if (!data.due_date) {
      newErrors.due_date = 'Due date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAddTask = async () => {
    if (!validateForm(taskData)) return;
    try {
      const taskToSubmit = {
        ...taskData,
        assignee_id: taskData.assignee_id || null,
      };
      await apiService.createTask(taskToSubmit);

      onTaskAdded();

      setTaskData({
        title: '',
        description: '',
        priority: 'Low',
        status: 'Pending',
        due_date: '',
        assignee_id: ''
      });
    } catch (error) {
      console.error('Error adding task:', error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || 'Failed to add task'}`);
    }
  };

  const handleSaveTask = async () => {
    if (!validateForm(taskData)) return;
    try {
      await apiService.editTask(editingTask.id, taskData);

      onTaskSaved();
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || 'Failed to save task'}`);
    }
  };

  return (
    <div className="mb-4">
      {editingTask ? <h4>Edit Task</h4> : <h4>Add Task</h4>}
      <div>
        <label>Title:</label>
        <input
          type="text"
          name="title"
          className="form-control mb-2"
          value={taskData.title}
          onChange={handleInputChange}
        />
        {errors.title && <div className="text-danger">{errors.title}</div>}

        <label>Description:</label>
        <textarea
          name="description"
          className="form-control mb-2"
          value={taskData.description}
          onChange={handleInputChange}
        />

        <label>Priority:</label>
        <select
          name="priority"
          className="form-control mb-2"
          value={taskData.priority}
          onChange={handleInputChange}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <label>Status:</label>
        <select
          name="status"
          className="form-control mb-2"
          value={taskData.status}
          onChange={handleInputChange}
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <label>Due Date:</label>
        <input
          type="datetime-local"
          name="due_date"
          className="form-control mb-2"
          value={taskData.due_date}
          onChange={handleInputChange}
        />
        {errors.due_date && <div className="text-danger">{errors.due_date}</div>}

        <label>Assignee (optional):</label>
        <select
          name="assignee_id"
          className="form-control mb-2"
          value={taskData.assignee_id || ''}
          onChange={handleInputChange}
        >
          <option value="">Unassigned</option>
          {friends.map((friend) => (
              <option key={friend.id} value={friend.id}>
                {friend.name} ({friend.email})
            </option>
          ))}
        </select>

        {editingTask ? (
          <>
            <button className="btn btn-primary me-2" onClick={handleSaveTask}>
              Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setEditingTask(null)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button className="btn btn-success" onClick={handleAddTask}>
            Add
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskForm;
