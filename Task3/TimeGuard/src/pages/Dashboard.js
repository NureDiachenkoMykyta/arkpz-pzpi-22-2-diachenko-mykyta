import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // Сервіс для авторизації

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Low',
    status: 'Pending', // Це потрібно додати, якщо воно є в API
    due_date: '',
    assignee_id: '', // Переконайтесь, що це значення правильно задане
  });
  const [timeEntry, setTimeEntry] = useState({ taskId: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      navigate('/login');
    } else {
      fetchTasks(); // Завантажуємо завдання при завантаженні сторінки
    }
  }, [navigate]);

  const fetchTasks = async () => {
    try {
      // Використовуємо правильний ендпоінт для отримання завдань
      const response = await axios.get('http://localhost:3000/api/tasks/my-tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      // Перевіряємо, що відповідає масив завдань
      if (Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        setError('Invalid response from API: tasks are not in array format');
      }
    } catch (error) {
      setError('Error fetching tasks');
    }
  };

  const handleAddTask = async () => {
    console.log('Adding task:', newTask);  // Додано логування для перевірки перед відправкою
    try {
      // Використовуємо ендпоінт для додавання нового завдання
      const response = await axios.post(
        'http://localhost:3000/api/tasks/create',
        newTask, // Ті самі дані
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess('Task added successfully!');
      fetchTasks();
      setNewTask({ title: '', description: '', priority: 'Low' });
    } catch (error) {
      console.error('Error adding task:', error.response?.data);  // Логування помилки для діагностики
      setError('Error adding task');
    }
  };

  const handleAddTimeEntry = async () => {
    try {
      // Використовуємо ендпоінт для додавання часу
      await axios.post(
        'http://localhost:3000/api/time-entries/create',
        timeEntry,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess('Time entry added successfully!');
      setTimeEntry({ taskId: '', startTime: '', endTime: '' });
    } catch (error) {
      setError('Error adding time entry');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="container mt-4">
      <h2>Dashboard</h2>
      <button className="btn btn-danger mb-3" onClick={handleLogout}>Logout</button>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Секція додавання нового завдання */}
      <div className="mb-4">
        <h4>Add New Task</h4>
        <input
          type="text"
          placeholder="Task Title"
          className="form-control mb-2"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <textarea
          placeholder="Task Description"
          className="form-control mb-2"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <select
          className="form-select mb-2"
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button className="btn btn-success" onClick={handleAddTask}>Add Task</button>
      </div>

      {/* Секція для перегляду завдань */}
      <h4>Tasks</h4>
      <div className="row">
        {/* Перевірка, чи tasks - це масив перед викликом .map() */}
        {Array.isArray(tasks) && tasks.length > 0 ? (
          tasks.map((task) => (
            <div className="col-md-4" key={task.id}>
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">{task.title}</h5>
                  <p className="card-text">{task.description}</p>
                  <p className="card-text">Priority: {task.priority}</p>
                  <p className="card-text">Status: {task.status}</p>

                  {/* Додавання часу для виконаного завдання */}
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="collapse"
                    href={`#collapseTimeEntry${task.id}`}
                    role="button"
                    aria-expanded="false"
                    aria-controls={`collapseTimeEntry${task.id}`}
                  >
                    Add Time Entry
                  </button>

                  <div className="collapse" id={`collapseTimeEntry${task.id}`}>
                    <div className="card card-body">
                      <input
                        type="datetime-local"
                        className="form-control mb-2"
                        value={timeEntry.startTime}
                        onChange={(e) => setTimeEntry({ ...timeEntry, startTime: e.target.value, taskId: task.id })}
                      />
                      <input
                        type="datetime-local"
                        className="form-control mb-2"
                        value={timeEntry.endTime}
                        onChange={(e) => setTimeEntry({ ...timeEntry, endTime: e.target.value })}
                      />
                      <button className="btn btn-info" onClick={handleAddTimeEntry}>Submit Time</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-md-12">
            <p>No tasks available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
