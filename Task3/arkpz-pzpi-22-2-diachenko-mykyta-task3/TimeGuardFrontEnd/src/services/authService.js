import apiService from './apiService';

const authService = {

  login: async (email, password) => {
    const response = await apiService.login({ email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
  },


  register: async (name, email, password, passwordConfirmation) => {
    const response = await apiService.register({ name, email, password, passwordConfirmation });
    const { token } = response.data;
    localStorage.setItem('token', token);
  },


  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getMe: async () => {
    return apiService.getMe(); 
  },
};

export default authService;
