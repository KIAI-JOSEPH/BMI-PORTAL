/**
 * BMI UMS - Student Service
 * Handles all student-related API operations
 */

import { authFetch } from './authService';
import { Student } from '../types';

const API_URL = '/api/v1';

export interface StudentResponse {
  success: boolean;
  data?: Student;
  error?: string;
  message?: string;
}

export interface StudentsListResponse {
  success: boolean;
  data?: Student[];
  meta?: {
    page: number;
    perPage: number;
    total: number;
  };
  error?: string;
}

export interface StudentFilters {
  page?: number;
  perPage?: number;
  faculty?: string;
  status?: string;
  search?: string;
}

/**
 * Get all students with optional filters
 */
export async function getStudents(filters?: StudentFilters): Promise<StudentsListResponse> {
  try {
    console.log('[StudentService] getStudents called with filters:', filters);
    
    // Check if we have a token
    const { getToken } = await import('./authService');
    const token = getToken();
    console.log('[StudentService] Current token:', token ? `${token.substring(0, 20)}...` : 'NULL');
    
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.perPage) params.append('perPage', filters.perPage.toString());
    if (filters?.faculty) params.append('faculty', filters.faculty);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `${API_URL}/students${queryString ? `?${queryString}` : ''}`;
    
    console.log('[StudentService] Fetching from URL:', url);

    const response = await authFetch(url, {}, 8000);
    console.log('[StudentService] Response status:', response.status);
    console.log('[StudentService] Response ok:', response.ok);
    
    const data: StudentsListResponse = await response.json();
    console.log('[StudentService] Parsed response data:', data);
    
    return data;
  } catch (error) {
    console.error('[StudentService] Error in getStudents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch students',
    };
  }
}

/**
 * Get a single student by ID
 */
export async function getStudent(id: string): Promise<StudentResponse> {
  try {
    const response = await authFetch(`${API_URL}/students/${id}`, {}, 5000);
    const data: StudentResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student',
    };
  }
}

/**
 * Create a new student
 */
export async function createStudent(studentData: Partial<Student>): Promise<StudentResponse> {
  try {
    const response = await authFetch(
      `${API_URL}/students`,
      {
        method: 'POST',
        body: JSON.stringify(studentData),
      },
      10000
    );

    const data: StudentResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create student',
    };
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(id: string, studentData: Partial<Student>): Promise<StudentResponse> {
  try {
    const response = await authFetch(
      `${API_URL}/students/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(studentData),
      },
      10000
    );

    const data: StudentResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update student',
    };
  }
}

/**
 * Delete a student
 */
export async function deleteStudent(id: string): Promise<StudentResponse> {
  try {
    const response = await authFetch(
      `${API_URL}/students/${id}`,
      {
        method: 'DELETE',
      },
      5000
    );

    const data: StudentResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete student',
    };
  }
}

/**
 * Get student statistics
 */
export async function getStudentStats(): Promise<any> {
  try {
    const response = await authFetch(`${API_URL}/students/stats/overview`, {}, 5000);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    };
  }
}
