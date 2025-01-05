import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth'; // API для авторизації

const authService = {
  // Логін користувача
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    const { token } = response.data;

    if (token) {
      localStorage.setItem('token', token); // Зберігаємо токен
    }

    return response.data;
  },

  // Реєстрація користувача
  register: async (name, email, password, passwordConfirmation) => {
    const response = await axios.post(`${API_URL}/register`, {
      name,
      email,
      password,
      passwordConfirmation,
    });

    return response.data;
  },

  // Перевірка наявності токена в localStorage
  isLoggedIn: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Вихід з акаунту
  logout: () => {
    localStorage.removeItem('token');
  },
};

export default authService;
