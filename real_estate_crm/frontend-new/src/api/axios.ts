// src/api/axios.ts
import axios from 'axios';
import { store } from '../store/store'; // Импортируем наш store

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Создаем перехватчик запросов
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken; // Получаем токен из Redux
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Добавляем заголовок
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;