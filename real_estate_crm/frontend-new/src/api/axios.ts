import axios from 'axios';
import { store } from '../store/store';
import { setAuthTokens, logout } from '../store/authSlice';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик ЗАПРОСОВ (добавляет токен в заголовок)
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- НОВЫЙ ПЕРЕХВАТЧИК ОТВЕТОВ (обновляет токен) ---
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = store.getState().auth.refreshToken;

    // Если ошибка 401, токен истек и это не повторный запрос
    if (error.response.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true; // Помечаем запрос как повторный

      try {
        // Запрашиваем новый access токен с помощью refresh токена
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
          refresh: refreshToken,
        });

        const newTokens = response.data;

        // Сохраняем новые токены в Redux
        store.dispatch(setAuthTokens({ access: newTokens.access, refresh: newTokens.refresh || refreshToken }));

        // Обновляем заголовок в оригинальном запросе
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

        // Повторяем оригинальный запрос с новым токеном
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Если refresh токен тоже истек или невалиден, выходим из системы
        store.dispatch(logout());
        window.location.href = '/login'; // Перенаправляем на страницу входа
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default apiClient;