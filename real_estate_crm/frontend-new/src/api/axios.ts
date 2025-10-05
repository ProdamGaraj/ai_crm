import axios from 'axios';
import { refreshAccessToken } from './auth';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для получения токенов из localStorage (где Zustand их хранит)
const getAuthTokens = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return {
        accessToken: parsed.state?.accessToken,
        refreshToken: parsed.state?.refreshToken,
      };
    }
  } catch (error) {
    console.error('Error reading auth tokens:', error);
  }
  return { accessToken: null, refreshToken: null };
};

// Функция для обновления токенов в localStorage
const setAuthTokens = (accessToken: string, refreshToken: string) => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state.accessToken = accessToken;
      parsed.state.refreshToken = refreshToken;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('Error updating auth tokens:', error);
  }
};

// Функция для очистки токенов
const clearAuthTokens = () => {
  try {
    localStorage.removeItem('auth-storage');
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};

// Перехватчик ЗАПРОСОВ (добавляет токен в заголовок)
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = getAuthTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ОТВЕТОВ (обновляет токен при 401 ошибке)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const { refreshToken } = getAuthTokens();

    // Если ошибка 401, токен истек и это не повторный запрос
    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Запрашиваем новый access токен с помощью refresh токена
        const response = await refreshAccessToken(refreshToken);

        // Сохраняем новые токены
        setAuthTokens(response.access, response.refresh || refreshToken);

        // Обновляем заголовок в оригинальном запросе
        originalRequest.headers.Authorization = `Bearer ${response.access}`;

        // Повторяем оригинальный запрос с новым токеном
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Если refresh токен тоже истек или невалиден, выходим из системы
        clearAuthTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;