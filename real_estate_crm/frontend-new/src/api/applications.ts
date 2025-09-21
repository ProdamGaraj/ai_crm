import apiClient from './axios';
import type { Client } from './clients'; // Импортируем тип клиента для вложенности

/**
 * Тип для заявки в общем списке (краткая информация).
 */
export interface Application {
  id: number;
  status: string;
  source: string;
  client: string; // В списке это просто имя клиента
  precise_source: string | null;
  created_by: string | null;
  created_at: string;
}

/**
 * Расширенный тип для детальной карточки заявки.
 */
export interface ApplicationDetail extends Application {
  id: number;
  client: Client; // Здесь уже полный объект клиента
  status: string;
  source: string;
  precise_source: number | null; // ID
  interested_projects: number[]; // Массив ID
  interested_property_type: string;
  min_area: string | null;
  max_area: string | null;
  min_floor: number | null;
  max_floor: number | null;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  logs: any[];
  rejection_reason: RejectionReason | null;
}

/**
 * Тип для данных, отправляемых на бэкенд при создании заявки.
 */
export interface ApplicationPayload {
  client_id?: number;
  source?: 'INTERNET' | 'SOCIAL_MEDIA' | 'OFFICE' | 'CALL';
  status?: string;
  notes?: string;
  rejection_reason_id?: number | null;
  // Добавляем поля интересов
  interested_property_type?: string;
  min_area?: number | null;
  max_area?: number | null;
  min_floor?: number | null;
  max_floor?: number | null;
}
export const deleteApplication = async (id: number): Promise<void> => {
  await apiClient.delete(`/applications/${id}/`);
};
/**
 * Получает список всех заявок.
 */
export const getApplications = async (): Promise<Application[]> => {
  const response = await apiClient.get('/applications/');
  return response.data;
};

/**
 * Получает одну заявку по ее ID.
 */
export const getApplicationById = async (id: number): Promise<ApplicationDetail> => {
  const response = await apiClient.get(`/applications/${id}/`);
  return response.data;
};

/**
 * Создает новую заявку.
 */
export const createApplication = async (payload: ApplicationPayload): Promise<ApplicationDetail> => {
  const response = await apiClient.post('/applications/', payload);
  return response.data;
};

export interface RejectionReason {
  id: number;
  name: string;
}
export const getRejectionReasons = async (): Promise<RejectionReason[]> => {
  const response = await apiClient.get('/rejection-reasons/');
  return response.data;
};

// Новая функция для обновления заявки
export const updateApplication = async (
  { id, payload }: { id: number; payload: ApplicationPayload }
): Promise<ApplicationDetail> => {
  const response = await apiClient.patch(`/applications/${id}/`, payload);
  return response.data;
};