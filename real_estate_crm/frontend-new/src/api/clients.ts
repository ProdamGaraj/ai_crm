import apiClient from './axios';
import type { Application } from './applications'; // Импортируем тип для вложенных заявок

/**
 * Базовый тип для клиента в общем списке.
 */
export interface Client {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  created_at: string;
}

/**
 * Тип для лога изменений клиента.
 */
export interface ClientLog {
  id: number;
  user: string;
  action: string;
  created_at: string;
}

/**
 * Расширенный тип для детальной карточки клиента.
 * Включает вложенные списки заявок и логов.
 */
export interface ClientDetail extends Client {
  date_of_birth: string | null;
  gender: string;
  marital_status: string;
  passport_series_number: string;
  passport_issued_by: string;
  passport_issued_date: string | null;
  pinfl: string;
  registration_address: string;
  created_by: string | null;
  updated_at: string;
  applications: Application[];
  logs: ClientLog[];
}

/**
 * Тип для данных, отправляемых на бэкенд при создании клиента.
 */
export type ClientPayload = {
  full_name: string;
  phone_number: string;
  email?: string;
  // Сюда можно добавлять другие поля для формы создания/редактирования
};

/**
 * Получает список всех клиентов.
 */
export const getClients = async (): Promise<Client[]> => {
  const response = await apiClient.get('/clients/');
  return response.data;
};

/**
 * Получает одного клиента по его ID.
 */
export const getClientById = async (id: number): Promise<ClientDetail> => {
  const response = await apiClient.get(`/clients/${id}/`);
  return response.data;
};

/**
 * Создает нового клиента.
 */
export const createClient = async (newClient: ClientPayload): Promise<ClientDetail> => {
  const response = await apiClient.post('/clients/', newClient);
  return response.data;
};