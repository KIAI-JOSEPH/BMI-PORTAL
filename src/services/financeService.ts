/**
 * BMI UMS - Finance Service
 */

import { authFetch } from './authService';
import { Transaction } from '../types';

const API_URL = '/api/v1';

export interface TransactionResponse {
  success: boolean;
  data?: Transaction;
  error?: string;
}

export interface TransactionListResponse {
  success: boolean;
  data?: Transaction[];
  meta?: {
    page: number;
    perPage: number;
    total: number;
  };
  error?: string;
}

export async function getTransactions(filters?: any): Promise<TransactionListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.perPage) params.append('perPage', filters.perPage.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `${API_URL}/finance/transactions${queryString ? `?${queryString}` : ''}`;
    const response = await authFetch(url);
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch transactions' };
  }
}

export async function createTransaction(data: Partial<Transaction>): Promise<TransactionResponse> {
  try {
    const response = await authFetch(`${API_URL}/finance/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to create transaction' };
  }
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<TransactionResponse> {
  try {
    const response = await authFetch(`${API_URL}/finance/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to update transaction' };
  }
}

export async function deleteTransaction(id: string): Promise<TransactionResponse> {
  try {
    const response = await authFetch(`${API_URL}/finance/transactions/${id}`, { method: 'DELETE' });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to delete transaction' };
  }
}

export async function getFinanceStats(): Promise<any> {
  try {
    const response = await authFetch(`${API_URL}/finance/stats`);
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch finance statistics' };
  }
}
