import apiClient from './axios';

/**
 * Тип для объекта сделки, как он приходит с бэкенда.
 * (Мы можем дополнять его по мере необходимости).
 */
export interface Deal {
  id: number;
  status: 'BOOKING' | 'IN_PROGRESS' | 'CLOSED_WON' | 'CANCELLED';
  booking_start_date: string;
  booking_end_date: string;
  client: number; // В ответе придет ID клиента
  property: number; // В ответе придет ID объекта
  created_by: number | null;
  created_at: string;
}

/**
 * Тип для данных, отправляемых на бэкенд при создании сделки (бронировании).
 */
export interface DealPayload {
  client: number; // ID клиента
  property: number; // ID объекта
  booking_end_date: string; // Дата в формате 'YYYY-MM-DD'
}

/**
 * Создает новую сделку (бронирует объект).
 * @param payload - Данные для создания сделки.
 * @returns - Созданный объект сделки.
 */
export const createDeal = async (payload: DealPayload): Promise<Deal> => {
  const response = await apiClient.post('/deals/', payload);
  return response.data;
};