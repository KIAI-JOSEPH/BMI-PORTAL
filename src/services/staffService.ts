import { API_URL } from './config';
/**
 * BMI UMS - Staff Service
 */

import { authFetch } from './authService';
import { StaffMember } from '../types';

async function parseJsonSafe(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}


export interface StaffResponse {
  success: boolean;
  data?: StaffMember;
  error?: string;
}

export interface StaffListResponse {
  success: boolean;
  data?: StaffMember[];
  meta?: {
    page: number;
    perPage: number;
    total: number;
  };
  error?: string;
}

export async function getStaff(filters?: any): Promise<StaffListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.perPage) params.append('perPage', filters.perPage.toString());
    if (filters?.department) params.append('department', filters.department);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `${API_URL}/staff${queryString ? `?${queryString}` : ''}`;
    const response = await authFetch(url);
    return await parseJsonSafe(response);
  } catch (error) {
    return { success: false, error: 'Failed to fetch staff' };
  }
}

export async function createStaff(data: Partial<StaffMember>): Promise<StaffResponse> {
  try {
    const response = await authFetch(`${API_URL}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(response);
  } catch (error) {
    return { success: false, error: 'Failed to create staff' };
  }
}

export async function updateStaff(id: string, data: Partial<StaffMember>): Promise<StaffResponse> {
  try {
    const response = await authFetch(`${API_URL}/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return await parseJsonSafe(response);
  } catch (error) {
    return { success: false, error: 'Failed to update staff' };
  }
}

export async function deleteStaff(id: string): Promise<StaffResponse> {
  try {
    const response = await authFetch(`${API_URL}/staff/${id}`, { method: 'DELETE' });
    return await parseJsonSafe(response);
  } catch (error) {
    return { success: false, error: 'Failed to delete staff' };
  }
}

export async function getStaffStats(): Promise<any> {
  try {
    const response = await authFetch(`${API_URL}/staff/stats/overview`);
    return await parseJsonSafe(response);
  } catch (error) {
    return { success: false, error: 'Failed to fetch staff statistics' };
  }
}
