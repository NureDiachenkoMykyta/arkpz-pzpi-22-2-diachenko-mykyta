import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [friends, setFriends] = useState([]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Low',
    status: 'Pending',
    due_date: '',
    assignee_id: ''
  });
  const [errors, setErrors] = useState({});
  const [editingTask, setEditingTask] = useState(null);

  const [showTimeEntryForm, setShowTimeEntryForm] = useState(null);

  const [newTimeEntry, setNewTimeEntry] = useState({
    start_time: '',
    end_time: ''
  });


  const [timeEntries, setTimeEntries] = useState({});


  const [showTimeEntries, setShowTimeEntries] = useState(null);

  const [totalTime, setTotalTime] = useState({});

  useEffect(() => {
    const fetchTasksAndFriends = async () => {
      try {
        const tasksResponse = await apiService.getAllTasks();
        const tasksArray = Array.isArray(tasksResponse.data.tasks)
          ? tasksResponse.data.tasks
          : [];
        setTasks(tasksArray);

 
        for (const task of tasksArray) {
          await fetchTotalTime(task.id);
        }

        const friendsResponse = await apiService.getFriends();
        setFriends(Array.isArray(friendsResponse.data) ? friendsResponse.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setTasks([]);
        setFriends([]);
      }
    };

    fetchTasksAndFriends();
  }, []);


  const fetchAllTasks = async () => {
    try {
      const response = await apiService.getAllTasks();
      const tasksArray = Array.isArray(response.data.tasks)
        ? response.data.tasks
        : [];
      setTasks(tasksArray);


      for (const t of tasksArray) {
        await fetchTotalTime(t.id);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };


  const validateForm = (task) => {
    const newErrors = {};

    if (!task.title || task.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }
    if (!task.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingTask) {
      setEditingTask({ ...editingTask, [name]: value });
    } else {
      setNewTask({ ...newTask, [name]: value });
    }
    setErrors({ ...errors, [name]: '' });
  };


  const handleAddTask = async () => {
    if (!validateForm(newTask)) {
      return;
    }
    try {
      const taskToSubmit = {
        ...newTask,
        assignee_id: newTask.assignee_id || null
      };
      await apiService.createTask(taskToSubmit);


      setNewTask({
        title: '',
        description: '',
        priority: 'Low',
        status: 'Pending',
        due_date: '',
        assignee_id: ''
      });


      await fetchAllTasks();
    } catch (error) {
      console.error('Error adding task:', error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || 'Failed to add task'}`);
    }
  };


  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (taskToEdit) {
      setEditingTask({
        ...taskToEdit,

        due_date: new Date(taskToEdit.due_date)
          .toLocaleString('sv-SE', { timeZone: 'UTC' })
          .replace(' ', 'T')
      });
    }
  };


  const handleSaveTask = async () => {
    if (!validateForm(editingTask)) {
      return;
    }
    try {
      await apiService.editTask(editingTask.id, editingTask);
      setEditingTask(null);


      await fetchAllTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };


  const handleDeleteTask = async (taskId) => {
    try {
      await apiService.deleteTask(taskId);

      setTasks(tasks.filter((task) => task.id !== taskId));

    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTimeEntryChange = (e) => {
    const { name, value } = e.target;
    setNewTimeEntry({ ...newTimeEntry, [name]: value });
  };


  const handleAddTimeEntry = async (taskId) => {
    try {
      await apiService.createTimeEntry({
        task_id: taskId,
        start_time: newTimeEntry.start_time,
        end_time: newTimeEntry.end_time
      });
      setShowTimeEntryForm(null);
      setNewTimeEntry({ start_time: '', end_time: '' });


      fetchTotalTime(taskId);

      if (showTimeEntries === taskId) {
        fetchTimeEntries(taskId);
      }
    } catch (error) {
      console.error('Error adding time entry:', error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || 'Failed to add time entry'}`);
    }
  };


  const fetchTimeEntries = async (taskId) => {
    try {
      const response = await apiService.getTimeEntries(taskId);
      const entries = response.data.timeEntries || [];
      setTimeEntries((prev) => ({ ...prev, [taskId]: entries }));


      fetchTotalTime(taskId);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };


  const fetchTotalTime = async (taskId) => {
    if (!taskId) return; 
    try {
      const response = await apiService.getTotalTime(taskId);
      const totalSeconds = response.data.total_time_seconds || 0;
      setTotalTime((prev) => ({ ...prev, [taskId]: totalSeconds }));
    } catch (error) {
      console.error('Error fetching total time:', error);
    }
  };


  const handleDeleteTimeEntry = async (taskId, entryId) => {
    try {
      await apiService.deleteTimeEntry(entryId);
   
      fetchTotalTime(taskId);
  
      if (showTimeEntries === taskId) {
        fetchTimeEntries(taskId);
      }
    } catch (error) {
      console.error('Error deleting time entry:', error);
    }
  };


  const handleEditTimeEntry = async (taskId, entry) => {
    try {

      const updatedEntry = {
        ...entry,
        end_time: new Date().toISOString()
      };
      await apiService.editTimeEntry(entry.id, updatedEntry);

      fetchTotalTime(taskId);
      if (showTimeEntries === taskId) {
        fetchTimeEntries(taskId);
      }
    } catch (error) {
      console.error('Error editing time entry:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container mt-4">
      <h2>Tasks</h2>
      
      <div className="mb-4">
        {editingTask ? (
          <>
            <h4>Edit Task</h4>
            <div>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                className="form-control mb-2"
                value={editingTask.title}
                onChange={handleInputChange}
              />
              {errors.title && <div className="text-danger">{errors.title}</div>}

              <label>Description:</label>
              <textarea
                name="description"
                className="form-control mb-2"
                value={editingTask.description}
                onChange={handleInputChange}
              />
              <label>Priority:</label>
              <select
                name="priority"
                className="form-control mb-2"
                value={editingTask.priority}
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
                value={editingTask.status}
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
                value={editingTask.due_date}
                onChange={handleInputChange}
              />
              {errors.due_date && <div className="text-danger">{errors.due_date}</div>}

              <button className="btn btn-primary me-2" onClick={handleSaveTask}>
                Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setEditingTask(null)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h4>Add Task</h4>
            <div>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                className="form-control mb-2"
                value={newTask.title}
                onChange={handleInputChange}
              />
              {errors.title && <div className="text-danger">{errors.title}</div>}

              <label>Description:</label>
              <textarea
                name="description"
                className="form-control mb-2"
                value={newTask.description}
                onChange={handleInputChange}
              />
              <label>Priority:</label>
              <select
                name="priority"
                className="form-control mb-2"
                value={newTask.priority}
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
                value={newTask.status}
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
                value={newTask.due_date}
                onChange={handleInputChange}
              />
              {errors.due_date && <div className="text-danger">{errors.due_date}</div>}

              <label>Assignee (Optional):</label>
              <select
                name="assignee_id"
                className="form-control mb-2"
                value={newTask.assignee_id}
                onChange={handleInputChange}
              >
                <option value="">Unassigned</option>
                {friends.map((f) => (
                  <option key={f.Receiver.id} value={f.Receiver.id}>
                    {f.Receiver.name}
                  </option>
                ))}
              </select>

              <button className="btn btn-success" onClick={handleAddTask}>
                Add
              </button>
            </div>
          </>
        )}
      </div>

      <div>
        <h4>Existing Tasks</h4>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="border p-3 mb-3">
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
                {friends.find((f) => f.Receiver.id === task.assignee_id)?.Receiver
                  .name || 'Unassigned'}
              </p>
              <p>
                <strong>Total Time Spent:</strong>{' '}
                {formatTime(totalTime[task.id] || 0)}
              </p>

              <button
                className="btn btn-warning me-2"
                onClick={() => handleEditTask(task.id)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger me-2"
                onClick={() => handleDeleteTask(task.id)}
              >
                Delete
              </button>
              <button
                className="btn btn-primary me-2"
                onClick={() => setShowTimeEntryForm(task.id)}
              >
                Add Time Entry
              </button>
              <button
                className="btn btn-info"
                onClick={() => {
                  if (showTimeEntries === task.id) {
                    setShowTimeEntries(null);
                  } else {
                    fetchTimeEntries(task.id);
                    setShowTimeEntries(task.id);
                  }
                }}
              >
                {showTimeEntries === task.id
                  ? 'Hide Time Entries'
                  : 'View Time Entries'}
              </button>

              {showTimeEntryForm === task.id && (
                <div className="mt-3">
                  <h6>Add Time Entry</h6>
                  <label>Start Time:</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    className="form-control mb-2"
                    value={newTimeEntry.start_time}
                    onChange={handleTimeEntryChange}
                  />
                  <label>End Time:</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    className="form-control mb-2"
                    value={newTimeEntry.end_time}
                    onChange={handleTimeEntryChange}
                  />
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleAddTimeEntry(task.id)}
                  >
                    Save Time Entry
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowTimeEntryForm(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {showTimeEntries === task.id && (
                <div className="mt-3">
                  <h6>Time Entries</h6>
                  {(timeEntries[task.id] || []).map((entry) => (
                    <div key={entry.id} className="mb-2">
                      <p>
                        <strong>Start:</strong>{' '}
                        {new Date(entry.start_time).toLocaleString()}
                      </p>
                      <p>
                        <strong>End:</strong>{' '}
                        {entry.end_time
                          ? new Date(entry.end_time).toLocaleString()
                          : '—'}
                      </p>
                      <p>
                        <strong>Duration:</strong>{' '}
                        {entry.end_time
                          ? formatTime(
                              (new Date(entry.end_time) -
                                new Date(entry.start_time)) /
                                1000
                            )
                          : '—'}
                      </p>
                      <button
                        className="btn btn-danger btn-sm me-2"
                        onClick={() => handleDeleteTimeEntry(task.id, entry.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEditTimeEntry(task.id, entry)}
                      >
                        Edit (set End Time = now)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No tasks found.</p>
        )}
      </div>
    </div>
  );
};

export default Tasks;
