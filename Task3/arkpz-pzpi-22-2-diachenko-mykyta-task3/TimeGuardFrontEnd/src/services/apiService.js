import apiClient from './apiClient';

const apiService = {

  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),

  createTask: (data) => apiClient.post('/tasks/create', data),
  editTask: (taskId, data) => apiClient.put(`/tasks/edit/${taskId}`, data),
  deleteTask: (taskId) => apiClient.delete(`/tasks/delete/${taskId}`),
  getAllTasks: () => apiClient.get('/tasks/my-tasks'),
  getTaskById: (taskId) => apiClient.get(`/tasks/${taskId}`),

  createTimeEntry: (data) => apiClient.post('/time-entries/create', data),
  editTimeEntry: (entryId, data) => apiClient.put(`/time-entries/edit/${entryId}`, data),
  deleteTimeEntry: (entryId) => apiClient.delete(`/time-entries/delete/${entryId}`),
  getTimeEntryById: (entryId) => apiClient.get(`/time-entries/${entryId}`),
  getTimeEntries: (taskId) => apiClient.get(`/time-entries/task/${taskId}`),

  startTimer: (taskId) => apiClient.post('/tasks/start', { task_id: taskId }),
  stopTimer: (taskId) => apiClient.post('/tasks/stop', { task_id: taskId }),

  sendFriendRequest: (email) => apiClient.post('/friends/request', { email }),
  getFriendRequests: () => apiClient.get('/friends/requests'),
  respondToFriendRequest: (request_id, action) =>
    apiClient.post('/friends/respond', { request_id, action }),
  getFriends: () => apiClient.get('/friends'),
  removeFriend: (friend_id) =>
    apiClient.delete('/friends/remove', { data: { friend_id } }),
  getSentFriendRequests: () => apiClient.get('/friends/sent-requests'),
  cancelFriendRequest: (request_id) =>
    apiClient.delete(`/friends/cancel-request/${request_id}`),

  generateReport: (reportType, params) =>
    apiClient.get('/reports/generate', {
      params: { reportType, ...params },
    }),

  getTaskProgress: () => apiClient.get('/reports/generate/task-progress'),


  getTimeEntriesCalendar: (start_date, end_date) =>
    apiClient.get('/reports/generate/time-entries-calendar', {
      params: { start_date, end_date },
    }),


  getAchievements: () => apiClient.get('/reports/generate/achievements'),

  getActivityFeed: () => apiClient.get('/reports/generate/activity-feed'),

  getPerformanceMetrics: () => apiClient.get('/reports/generate/performance-metrics'),


  getUpcomingDeadlines: (days) =>
    apiClient.get('/reports/generate/upcoming-deadlines', {
      params: { days },
    }),

  getTaskDistribution: () => apiClient.get('/reports/generate/task-distribution'),

  getTotalTime: (taskId) => apiClient.get(`/tasks/${taskId}/total-time`),
};

export default apiService;
