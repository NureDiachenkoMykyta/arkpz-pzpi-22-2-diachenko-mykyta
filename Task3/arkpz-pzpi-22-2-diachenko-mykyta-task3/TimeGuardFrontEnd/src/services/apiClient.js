import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', 
});


apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldShowToast = error.config?.showToast !== false;

    if (error.response) {
      const { status, data } = error.response;

      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        if (shouldShowToast) {
          toast.error('Session expired. Please login again.');
        }
        window.location.href = '/login';
      }

      if (data && data.error && shouldShowToast) {
        toast.error(data.error);
      } else if (shouldShowToast) {
        toast.error('An error occurred. Please try again later.');
      }
    } else {
      if (shouldShowToast) {
        toast.error('No connection to the server.');
      }
    }

    return Promise.reject(error);
  }
);


export default apiClient;
