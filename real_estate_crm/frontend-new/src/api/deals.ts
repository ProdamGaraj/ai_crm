import apiClient from './axios';
import type { Discount } from './discounts';
import type { Client } from './clients';
import type { Property } from './buildings';
import type { Payment } from './finances';

/**
 * Расширенный тип для сделки, включающий вложенные объекты.
 */
export interface Deal {
  id: number;
  status: 'BOOKING' | 'IN_PROGRESS' | 'CLOSED_WON' | 'CANCELLED'| 'TERMINATED';
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
  payments: Payment[];
  signed_document_scan: string | null; // URL на скан
  client_signature_date: string | null;
  company_signature_date: string | null;
  logs: DealLog[];
  cancellation_reason: string | null;
  termination_document_scan: string | null;
  termination_date: string | null;
  logs: DealLog[];
}
export interface DealCancellationPayload {
  cancellation_reason?: string;
  termination_document_scan?: File;
  termination_date?: string;
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ API ---
export const cancelOrTerminateDeal = async ({ dealId, payload }: { dealId: number; payload: DealCancellationPayload }): Promise<Deal> => {
  const formData = new FormData();
  if (payload.cancellation_reason) {
    formData.append('cancellation_reason', payload.cancellation_reason);
  }
  if (payload.termination_document_scan) {
    formData.append('termination_document_scan', payload.termination_document_scan);
  }
  if (payload.termination_date) {
    formData.append('termination_date', payload.termination_date);
  }

  const response = await apiClient.post(`/deals/${dealId}/cancel/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
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
    contract_number?: string;
    contract_date?: string | null;
    signed_document_scan?: File | null; // Поле для файла
    client_signature_date?: string | null;
    company_signature_date?: string | null;
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
    const formData = new FormData();

    // Преобразуем объект payload в FormData
    for (const key in payload) {
        const value = payload[key as keyof DealUpdatePayload];

        if (value !== undefined && value !== null) {
            if (key === 'applied_discounts_ids' && Array.isArray(value)) {
                // Обрабатываем массив ID скидок
                value.forEach((discountId: number) => formData.append('applied_discounts_ids', String(discountId)));
            } else if (value instanceof File) {
                 // Добавляем файл
                formData.append(key, value);
            }
            else {
                // Добавляем остальные поля
                formData.append(key, String(value));
            }
        }
    }

    const response = await apiClient.patch(`/deals/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/**
 * Получает список доступных скидок для конкретной сделки.
 */
export const getAvailableDiscounts = async (dealId: number): Promise<Discount[]> => {
    const response = await apiClient.get(`/deals/${dealId}/available-discounts/`);
    return response.data;
};
export interface DealLog {
  id: number;
  user: string;
  action: string;
  created_at: string;
}