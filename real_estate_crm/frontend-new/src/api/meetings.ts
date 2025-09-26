import apiClient from './axios';
import type { Client } from './clients';
import type { BuildingMini } from './projects';

// Тип для лога встречи
export interface MeetingLog {
  id: number;
  user: string;
  action: string;
  created_at: string;
}

// Основной тип для встречи
export interface Meeting {
  id: number;
  client: Client;
  status: 'NEW' | 'COMPLETED' | 'CANCELLED';
  planned_date: string;
  actual_date: string | null;
  creator: string | null;
  executor: string;
  comment: string;
  result_comment: string;
  interested_building: BuildingMini | null;
  is_auto_created: boolean;
  is_overdue: boolean;
  logs: MeetingLog[];
}

// Тип для создания/обновления встречи
export interface MeetingPayload {
  client_id: number;
  application_id?: number;
  executor_id: number;
  planned_date: string;
  comment?: string;
  interested_building_id?: number | null;
  status?: 'NEW' | 'COMPLETED' | 'CANCELLED';
  actual_date?: string | null;
  result_comment?: string;
}

/**
 * Получает список всех встреч
 */
export const getMeetings = async (): Promise<Meeting[]> => {
  const response = await apiClient.get('/meetings/');
  return response.data;
};

/**
 * Создает новую встречу
 */
export const createMeeting = async (payload: MeetingPayload): Promise<Meeting> => {
  const response = await apiClient.post('/meetings/', payload);
  return response.data;
};

/**
 * Обновляет встречу по ее ID
 */
export const updateMeeting = async ({ id, payload }: { id: number; payload: Partial<MeetingPayload> }): Promise<Meeting> => {
    const response = await apiClient.patch(`/meetings/${id}/`, payload);
    return response.data;
};