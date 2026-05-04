/**
 * BMI UMS - Course Service
 */

import { authFetch } from './authService';
import { Course } from '../types';

const API_URL = '/api/v1';

export interface CourseResponse {
  success: boolean;
  data?: Course;
  error?: string;
}

export interface CourseListResponse {
  success: boolean;
  data?: Course[];
  meta?: {
    page: number;
    perPage: number;
    total: number;
  };
  error?: string;
}

export async function getCourses(filters?: any): Promise<CourseListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.perPage) params.append('perPage', filters.perPage.toString());
    if (filters?.faculty) params.append('faculty', filters.faculty);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `${API_URL}/courses${queryString ? `?${queryString}` : ''}`;
    const response = await authFetch(url);
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch courses' };
  }
}

export async function createCourse(data: Partial<Course>): Promise<CourseResponse> {
  try {
    const response = await authFetch(`${API_URL}/courses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to create course' };
  }
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<CourseResponse> {
  try {
    const response = await authFetch(`${API_URL}/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to update course' };
  }
}

export async function deleteCourse(id: string): Promise<CourseResponse> {
  try {
    const response = await authFetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to delete course' };
  }
}

export async function getCourseStats(): Promise<any> {
  try {
    const response = await authFetch(`${API_URL}/courses/stats/overview`);
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch course statistics' };
  }
}
