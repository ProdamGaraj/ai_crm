// src/api/auth.ts
import apiClient from './axios';

// ... (типы для пользователя и токенов)

export const loginUser = async (loginData: LoginPayload) => {
  const response = await apiClient.post('/token/', loginData);
  return response.data as AuthTokens;
};