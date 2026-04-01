import axios from 'axios';

const api = axios.create({
  baseURL: 'http://13.205.79.39:8000',
});

export default api;
