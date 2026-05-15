// Campus Service
import { authFetch } from './authService';
import { API_URL } from './config';
import { parseJsonSafe } from './apiClient';

export interface Campus {
  id: string;
  name: string;
  code: string;
  location: string;
  status: 'active' | 'inactive';
  created: string;
  updated: string;
}

export interface CampusStats {
  campus: Campus;
  students: number;
  staff: number;
  courses: number;
}

interface CampusResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    perPage: number;
    total: number;
  };
}

/**
 * Get all active campuses (for dropdowns)
 */
export async function getAllCampuses(): Promise<Campus[]> {
  const response = await authFetch(`${API_URL}/campuses/all`);
  const data = await parseJsonSafe<CampusResponse<Campus[]>>(response);
  return data?.success && data.data ? data.data : [];
}

/**
 * Get paginated list of campuses
 */
export async function getCampuses(params?: {
  page?: number;
  perPage?: number;
  status?: 'active' | 'inactive';
  search?: string;
}): Promise<{ data: Campus[]; meta: { page: number; perPage: number; total: number } }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.perPage) query.append('perPage', params.perPage.toString());
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const response = await authFetch(`${API_URL}/campuses${query.toString() ? `?${query.toString()}` : ''}`);
  const data = await parseJsonSafe<CampusResponse<Campus[]>>(response);
  
  return {
    data: data?.data || [],
    meta: data?.meta || { page: 1, perPage: 10, total: 0 },
  };
}

/**
 * Get a single campus by ID
 */
export async function getCampus(id: string): Promise<Campus | null> {
  const response = await authFetch(`${API_URL}/campuses/${id}`);
  const data = await parseJsonSafe<CampusResponse<Campus>>(response);
  return data?.success ? data.data : null;
}

/**
 * Get campus statistics
 */
export async function getCampusStats(id: string): Promise<CampusStats | null> {
  const response = await authFetch(`${API_URL}/campuses/${id}/stats`);
  const data = await parseJsonSafe<CampusResponse<CampusStats>>(response);
  return data?.success ? data.data : null;
}

/**
 * Get students by campus
 */
export async function getCampusStudents(
  id: string,
  params?: { page?: number; perPage?: number }
): Promise<{ data: any[]; meta: { page: number; perPage: number; total: number } }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.perPage) query.append('perPage', params.perPage.toString());

  const response = await authFetch(`${API_URL}/campuses/${id}/students${query.toString() ? `?${query.toString()}` : ''}`);
  const data = await parseJsonSafe<CampusResponse<any[]>>(response);
  
  return {
    data: data?.data || [],
    meta: data?.meta || { page: 1, perPage: 10, total: 0 },
  };
}

/**
 * Get staff by campus
 */
export async function getCampusStaff(
  id: string,
  params?: { page?: number; perPage?: number }
): Promise<{ data: any[]; meta: { page: number; perPage: number; total: number } }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.perPage) query.append('perPage', params.perPage.toString());

  const response = await authFetch(`${API_URL}/campuses/${id}/staff${query.toString() ? `?${query.toString()}` : ''}`);
  const data = await parseJsonSafe<CampusResponse<any[]>>(response);
  
  return {
    data: data?.data || [],
    meta: data?.meta || { page: 1, perPage: 10, total: 0 },
  };
}

/**
 * Get courses by campus
 */
export async function getCampusCourses(
  id: string,
  params?: { page?: number; perPage?: number }
): Promise<{ data: any[]; meta: { page: number; perPage: number; total: number } }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.perPage) query.append('perPage', params.perPage.toString());

  const response = await authFetch(`${API_URL}/campuses/${id}/courses${query.toString() ? `?${query.toString()}` : ''}`);
  const data = await parseJsonSafe<CampusResponse<any[]>>(response);
  
  return {
    data: data?.data || [],
    meta: data?.meta || { page: 1, perPage: 10, total: 0 },
  };
}

/**
 * Create a new campus (admin only)
 */
export async function createCampus(data: {
  name: string;
  code: string;
  location: string;
  status?: 'active' | 'inactive';
}): Promise<Campus | null> {
  const response = await authFetch(`${API_URL}/campuses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const resData = await parseJsonSafe<CampusResponse<Campus>>(response);
  return resData?.success ? resData.data : null;
}

/**
 * Update a campus (admin only)
 */
export async function updateCampus(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    location: string;
    status: 'active' | 'inactive';
  }>
): Promise<Campus | null> {
  const response = await authFetch(`${API_URL}/campuses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const resData = await parseJsonSafe<CampusResponse<Campus>>(response);
  return resData?.success ? resData.data : null;
}

/**
 * Delete a campus (admin only)
 */
export async function deleteCampus(id: string): Promise<boolean> {
  const response = await authFetch(`${API_URL}/campuses/${id}`, {
    method: 'DELETE',
  });
  return response.ok;
}
