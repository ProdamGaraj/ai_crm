import apiClient from './axios';
import type { Discount } from './discounts';
import type { Client } from './clients';
import type { Property } from './buildings';

/**
 * Расширенный тип для сделки, включающий вложенные объекты.
 */
export interface Deal {
  id: number;
  status: 'BOOKING' | 'IN_PROGRESS' | 'CLOSED_WON' | 'CANCELLED';
  booking_start_date: string;
  booking_end_date: string;
  client: Client; // Вложенный объект клиента
  property: Property; // Вложенный объект недвижимости
  created_by: string | null;
  created_at: string;
  initial_price: string;
  initial_price_per_sqm: string;
  contract_price: string | null;
  notes: string;
  applied_discounts: Discount[];
}

/**
 * Тип для данных при создании сделки (бронировании).
 */
export interface DealPayload {
  client: number;
  property: number;
  booking_end_date: string;
}

/**
 * Тип для данных при обновлении сделки.
 */
export interface DealUpdatePayload {
    notes?: string;
    contract_price?: number;
    applied_discounts_ids?: number[];
}

/**
 * Создает новую сделку.
 */
export const createDeal = async (payload: DealPayload): Promise<Deal> => {
  const response = await apiClient.post('/deals/', payload);
  return response.data;
};

/**
 * Получает одну сделку по ее ID.
 */
export const getDealById = async (id: number): Promise<Deal> => {
    const response = await apiClient.get(`/deals/${id}/`);
    return response.data;
};

/**
 * Обновляет сделку по ее ID.
 */
export const updateDeal = async ({ id, payload }: { id: number; payload: DealUpdatePayload }): Promise<Deal> => {
    const response = await apiClient.patch(`/deals/${id}/`, payload);
    return response.data;
};

/**
 * Получает список доступных скидок для конкретной сделки.
 */
export const getAvailableDiscounts = async (dealId: number): Promise<Discount[]> => {
    const response = await apiClient.get(`/deals/${dealId}/available-discounts/`);
    return response.data;
};