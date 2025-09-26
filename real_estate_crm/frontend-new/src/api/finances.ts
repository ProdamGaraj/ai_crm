// real_estate_crm/frontend-new/src/api/finances.ts

import apiClient from './axios';

// --- ИНТЕРФЕЙСЫ ---

// Справочники
export interface PaymentType {
  id: number;
  name: string;
}

export interface BeneficiaryAccount {
  id: number;
  name: string;
}

// Платеж
export interface Payment {
  id: number;
  amount: string;
  currency: string;
  method: string;
  due_date: string;
  payment_date: string | null;
  get_status_display: string;
  created_at: string;
  payment_type: string;
  beneficiary_account: string;
  created_by: string;
  responsible_employee: string;
}

// Данные для создания одного платежа в графике
export interface PaymentSchedulePayloadItem {
  amount: number;
  due_date: string;
  payment_type_id: number;
  beneficiary_account_id: number;
  currency: 'UZS' | 'USD' | 'EUR';
  method: 'CASH' | 'CASHLESS';
}

// --- ФУНКЦИИ API ---

export const getPaymentTypes = async (): Promise<PaymentType[]> => {
  const response = await apiClient.get('/finances/payment-types/');
  return response.data;
};
export const createPaymentType = async (payload: { name: string }): Promise<PaymentType> => {
  return (await apiClient.post('/finances/payment-types/', payload)).data;
};
export const deletePaymentType = async (id: number): Promise<void> => {
  await apiClient.delete(`/finances/payment-types/${id}/`);
};
export const getBeneficiaryAccounts = async (): Promise<BeneficiaryAccount[]> => {
  const response = await apiClient.get('/finances/beneficiary-accounts/');
  return response.data;
};

export const createPaymentSchedule = async ({ dealId, payments }: { dealId: number; payments: PaymentSchedulePayloadItem[] }): Promise<Payment[]> => {
  const response = await apiClient.post(`/deals/${dealId}/payment-schedule/`, payments);
  return response.data;
};
export const createBeneficiaryAccount = async (payload: { name: string; details: string }): Promise<BeneficiaryAccount> => {
  return (await apiClient.post('/finances/beneficiary-accounts/', payload)).data;
};
export const deleteBeneficiaryAccount = async (id: number): Promise<void> => {
  await apiClient.delete(`/finances/beneficiary-accounts/${id}/`);
};
export interface PaymentUpdatePayload {
  payment_date?: string;
}
export const updatePayment = async ({ id, payload }: { id: number; payload: PaymentUpdatePayload }): Promise<Payment> => {
  const response = await apiClient.patch(`/finances/payments/${id}/`, payload);
  return response.data;
};