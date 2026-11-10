import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Pulls a readable message out of an axios error.
export const errMsg = (err) => err?.response?.data?.message || err?.message || 'Something went wrong';

export default api;
