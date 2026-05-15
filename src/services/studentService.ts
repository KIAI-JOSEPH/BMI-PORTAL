/**
 * BMI UMS - Student Service
 * Handles all student-related API operations
 */

import { authFetch } from './authService';
import { Student } from '../types';
import { parseJsonSafe } from './apiClient';

import { API_URL } from './config';

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

type StudentLike = Partial<Student> & Record<string, any>;

function normalizeStudent(student: StudentLike): Student {
  const first_name = student.first_name ?? student.firstName ?? '';
  const last_name = student.last_name ?? student.lastName ?? '';
  const program_code = student.program_code ?? student.programCode ?? '';
  const admission_date = student.admission_date ?? student.admissionDate ?? '';
  const avatar_color = student.avatar_color ?? student.avatarColor ?? 'bg-purple-600';
  const photo_zoom = student.photo_zoom ?? student.photoZoom ?? 1;
  const photo_position = student.photo_position ?? student.photoPosition ?? { x: 0, y: 0 };

  return {
    ...student,
    first_name,
    last_name,
    program_code,
    admission_date,
    avatar_color,
    photo_zoom,
    photo_position,
    // Compatibility aliases for components still using camelCase.
    firstName: first_name,
    lastName: last_name,
    programCode: program_code,
    admissionDate: admission_date,
    avatarColor: avatar_color,
    photoZoom: photo_zoom,
    photoPosition: photo_position,
  } as Student;
}

function toStudentApiPayload(studentData: StudentLike): Record<string, any> {
  return {
    ...studentData,
    first_name: studentData.first_name ?? studentData.firstName,
    last_name: studentData.last_name ?? studentData.lastName,
    program_code: studentData.program_code ?? studentData.programCode,
    admission_date: studentData.admission_date ?? studentData.admissionDate,
    avatar_color: studentData.avatar_color ?? studentData.avatarColor,
    photo_zoom: studentData.photo_zoom ?? studentData.photoZoom,
    photo_position: studentData.photo_position ?? studentData.photoPosition,
  };
}

/**
 * Get all students with optional filters
 */
export async function getStudents(filters?: StudentFilters): Promise<StudentsListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.perPage) params.append('perPage', filters.perPage.toString());
    if (filters?.faculty) params.append('faculty', filters.faculty);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `${API_URL}/students${queryString ? `?${queryString}` : ''}`;

    const response = await authFetch(url, {}, 8000);
    const data = await parseJsonSafe<StudentsListResponse>(response);
    if (!data) {
      return { success: false, error: 'Invalid API response from students endpoint' };
    }
    return {
      ...data,
      data: data.data?.map(normalizeStudent),
    };
  } catch (error) {
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
    const data = await parseJsonSafe<StudentResponse>(response);
    if (!data) return { success: false, error: 'Invalid API response from student endpoint' };
    return {
      ...data,
      data: data.data ? normalizeStudent(data.data as StudentLike) : undefined,
    };
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
        body: JSON.stringify(toStudentApiPayload(studentData as StudentLike)),
      },
      10000
    );

    const data = await parseJsonSafe<StudentResponse>(response);
    if (!data) return { success: false, error: 'Invalid API response from create student endpoint' };
    return {
      ...data,
      data: data.data ? normalizeStudent(data.data as StudentLike) : undefined,
    };
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
        body: JSON.stringify(toStudentApiPayload(studentData as StudentLike)),
      },
      10000
    );

    const data = await parseJsonSafe<StudentResponse>(response);
    if (!data) return { success: false, error: 'Invalid API response from update student endpoint' };
    return {
      ...data,
      data: data.data ? normalizeStudent(data.data as StudentLike) : undefined,
    };
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

    const data = await parseJsonSafe<StudentResponse>(response);
    return data ?? { success: false, error: 'Invalid API response from delete student endpoint' };
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
    const data = await parseJsonSafe<any>(response);
    return data ?? { success: false, error: 'Invalid API response from student stats endpoint' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    };
  }
}
