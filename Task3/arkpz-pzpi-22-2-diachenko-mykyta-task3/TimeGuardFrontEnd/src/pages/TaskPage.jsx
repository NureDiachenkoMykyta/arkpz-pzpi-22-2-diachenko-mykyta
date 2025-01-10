import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import TaskList from '../components/Tasks/TaskList';
import TaskForm from '../components/Tasks/TaskForm';
import Header from "../components/Header"

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [friends, setFriends] = useState([]);
  const [totalTime, setTotalTime] = useState({}); 
  

  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasksAndFriends();
  }, []);

  const fetchTasksAndFriends = async () => {
    try {
      const tasksResponse = await apiService.getAllTasks();
      const tasksArray = Array.isArray(tasksResponse.data.tasks) ? tasksResponse.data.tasks : [];
      setTasks(tasksArray);

 
      for (const task of tasksArray) {
        await fetchTotalTime(task.id);
      }

      const friendsResponse = await apiService.getFriends();
      console.log(friendsResponse.data)
      setFriends(Array.isArray(friendsResponse.data) ? friendsResponse.data : []);
    } catch (error) {
      console.error('Error fetching tasks or friends:', error);
      setTasks([]);
      setFriends([]);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await apiService.getAllTasks();
      const tasksArray = Array.isArray(response.data.tasks) ? response.data.tasks : [];
      setTasks(tasksArray);

      for (const t of tasksArray) {
        await fetchTotalTime(t.id);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTotalTime = async (taskId) => {
    try {
      const response = await apiService.getTotalTime(taskId);
      const totalSeconds = response.data.total_time_seconds || 0;
      setTotalTime((prev) => ({ ...prev, [taskId]: totalSeconds }));
    } catch (error) {
      console.error('Error fetching total time:', error);
    }
  };

  const handleRefreshTask = async (taskId) => {
    await fetchTotalTime(taskId);
    await fetchAllTasks(); 

  };

  return (
    <div className="container mt-4">
      <Header/>
      <h2>Tasks</h2>

      <TaskForm
        friends={friends}
        onTaskAdded={fetchAllTasks}
        editingTask={editingTask}
        setEditingTask={setEditingTask}
        onTaskSaved={fetchAllTasks}
      />

      <TaskList
        tasks={tasks}
        friends={friends}
        totalTime={totalTime}
        onRefresh={handleRefreshTask}
        onTaskDeleted={fetchAllTasks}
        onEditTask={setEditingTask}
        fetchTotalTime={fetchTotalTime}
      />
    </div>
  );
};

export default TasksPage;
