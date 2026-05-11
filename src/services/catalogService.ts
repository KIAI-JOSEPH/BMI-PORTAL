import { API_URL } from './config';
import { authFetch } from './authService';


export interface CatalogRow {
  id: string;
  name?: string;
  faculty_code?: string;
  dept_code?: string;
  program_code?: string;
  degree_level?: string;
  [key: string]: unknown;
}

export async function getFaculties() {
  const res = await authFetch(`${API_URL}/catalog/faculties`);
  return res.json() as Promise<{ success: boolean; data?: CatalogRow[]; error?: string }>;
}

export async function getDepartments(facultyId?: string) {
  const q = facultyId ? `?facultyId=${encodeURIComponent(facultyId)}` : '';
  const res = await authFetch(`${API_URL}/catalog/departments${q}`);
  return res.json() as Promise<{ success: boolean; data?: CatalogRow[]; error?: string }>;
}

export async function getPrograms(deptId?: string) {
  const q = deptId ? `?deptId=${encodeURIComponent(deptId)}` : '';

async function parseJsonSafe(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
  const res = await authFetch(`${API_URL}/catalog/programs${q}`);
  return res.json() as Promise<{ success: boolean; data?: CatalogRow[]; error?: string }>;
}
