/**
 * BMI UMS - API-Backed Data Store for previously localStorage-only modules
 *
 * Modules like Hostels, Medical, Inventory, Alumni, Visitors, Attendance, and Communications
 * previously had NO backend persistence — they stored data in component state that was lost on refresh.
 *
 * This store provides a unified API-backed persistence layer using the backend API.
 * During the transition, it falls back to localStorage for offline/cached data,
 * but always attempts to sync with the API first.
 *
 * Usage in components:
 *   const { hostels, fetchHostels, createHostel } = useApiDataStore();
 */
import { create } from 'zustand';
import { authFetch } from '../services/authService';
import { API_URL } from '../services/config';

// ── Types ────────────────────────────────────────────────────────────
interface Hostel {
  id: string;
  name: string;
  type: 'Male' | 'Female';
  capacity: number;
  location: string;
  status: 'Available' | 'Near Capacity' | 'Full';
}

interface RoomAssignment {
  id: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  roomNumber: string;
  checkInDate: string;
  status: 'Active' | 'Revoked';
}

interface MedicalVisit {
  id: string;
  studentId: string;
  studentName: string;
  condition: string;
  bloodType: string;
  date: string;
  attendingStaff: string;
  status: 'Normal' | 'Urgent' | 'Follow-up';
  vitals: { temp: string; bp: string; pulse: string };
  notes: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  location: string;
  lastUpdated: string;
}

interface Visitor {
  id: string;
  name: string;
  purpose: string;
  host: string;
  checkIn: string;
  checkOut?: string;
  status: 'Active' | 'Checked Out';
}

interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string;
  records: Array<{
    studentId: string;
    studentName: string;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
  }>;
}

interface ApiDataState {
  // Entity collections (previously localStorage-only)
  hostels: Hostel[];
  roomAssignments: RoomAssignment[];
  medicalVisits: MedicalVisit[];
  inventoryItems: InventoryItem[];
  visitors: Visitor[];
  attendanceRecords: AttendanceRecord[];

  // Loading states
  isLoading: Record<string, boolean>;

  // Actions - Generic API-backed CRUD
  fetchCollection: <T>(key: string, endpoint: string) => Promise<T[]>;
  createItem: <T>(key: string, endpoint: string, data: Partial<T>) => Promise<T | null>;
  updateItem: <T>(key: string, endpoint: string, id: string, data: Partial<T>) => Promise<T | null>;
  deleteItem: (key: string, endpoint: string, id: string) => Promise<boolean>;

  // Convenience methods per module
  fetchHostels: () => Promise<void>;
  createHostel: (data: Partial<Hostel>) => Promise<Hostel | null>;
  fetchMedicalVisits: () => Promise<void>;
  createMedicalVisit: (data: Partial<MedicalVisit>) => Promise<MedicalVisit | null>;
  fetchInventory: () => Promise<void>;
  createInventoryItem: (data: Partial<InventoryItem>) => Promise<InventoryItem | null>;
  fetchVisitors: () => Promise<void>;
  createVisitor: (data: Partial<Visitor>) => Promise<Visitor | null>;
  fetchAttendance: () => Promise<void>;
  createAttendanceRecord: (data: Partial<AttendanceRecord>) => Promise<AttendanceRecord | null>;
}

const parseJsonSafe = async (response: Response) => {
  const text = await response.text();
  if (!text || text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const useApiDataStore = create<ApiDataState>((set, get) => ({
  hostels: [],
  roomAssignments: [],
  medicalVisits: [],
  inventoryItems: [],
  visitors: [],
  attendanceRecords: [],
  isLoading: {},

  // ── Generic API-backed CRUD ─────────────────────────────────────
  fetchCollection: async <T,>(key: string, endpoint: string): Promise<T[]> => {
    set((s) => ({ isLoading: { ...s.isLoading, [key]: true } }));
    try {
      const response = await authFetch(`${API_URL}${endpoint}`);
      const data = await parseJsonSafe(response);
      if (data?.success && data.data) {
        set((s) => ({ ...s, [key]: data.data, isLoading: { ...s.isLoading, [key]: false } }));
        return data.data as T[];
      }
      // Fallback: try localStorage cache
      const cached = localStorage.getItem(`bmi_cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached) as T[];
        set((s) => ({ ...s, [key]: parsed, isLoading: { ...s.isLoading, [key]: false } }));
        return parsed;
      }
      set((s) => ({ isLoading: { ...s.isLoading, [key]: false } }));
      return [];
    } catch {
      // Offline fallback: use localStorage cache
      const cached = localStorage.getItem(`bmi_cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached) as T[];
        set((s) => ({ ...s, [key]: parsed, isLoading: { ...s.isLoading, [key]: false } }));
        return parsed;
      }
      set((s) => ({ isLoading: { ...s.isLoading, [key]: false } }));
      return [];
    }
  },

  createItem: async <T,>(key: string, endpoint: string, data: Partial<T>): Promise<T | null> => {
    try {
      const response = await authFetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const result = await parseJsonSafe(response);
      if (result?.success && result.data) {
        // Optimistically update the collection
        set((s) => ({
          ...s,
          [key]: [...(s[key as keyof ApiDataState] as any[] || []), result.data],
        }));
        // Update localStorage cache
        const cached = localStorage.getItem(`bmi_cache_${key}`);
        const collection = cached ? JSON.parse(cached) : [];
        collection.push(result.data);
        localStorage.setItem(`bmi_cache_${key}`, JSON.stringify(collection));
        return result.data as T;
      }
      return null;
    } catch {
      return null;
    }
  },

  updateItem: async <T,>(key: string, endpoint: string, id: string, data: Partial<T>): Promise<T | null> => {
    try {
      const response = await authFetch(`${API_URL}${endpoint}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const result = await parseJsonSafe(response);
      if (result?.success && result.data) {
        set((s) => ({
          ...s,
          [key]: (s[key as keyof ApiDataState] as any[] || []).map((item: any) =>
            item.id === id ? result.data : item
          ),
        }));
        return result.data as T;
      }
      return null;
    } catch {
      return null;
    }
  },

  deleteItem: async (key: string, endpoint: string, id: string): Promise<boolean> => {
    try {
      const response = await authFetch(`${API_URL}${endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        set((s) => ({
          ...s,
          [key]: (s[key as keyof ApiDataState] as any[] || []).filter((item: any) => item.id !== id),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // ── Module-specific convenience methods ──────────────────────────

  fetchHostels: async () => {
    await get().fetchCollection<Hostel>('hostels', '/hostels');
  },

  createHostel: async (data) => {
    return await get().createItem<Hostel>('hostels', '/hostels', data);
  },

  fetchMedicalVisits: async () => {
    await get().fetchCollection<MedicalVisit>('medicalVisits', '/medical');
  },

  createMedicalVisit: async (data) => {
    return await get().createItem<MedicalVisit>('medicalVisits', '/medical', data);
  },

  fetchInventory: async () => {
    await get().fetchCollection<InventoryItem>('inventoryItems', '/inventory');
  },

  createInventoryItem: async (data) => {
    return await get().createItem<InventoryItem>('inventoryItems', '/inventory', data);
  },

  fetchVisitors: async () => {
    await get().fetchCollection<Visitor>('visitors', '/visitors');
  },

  createVisitor: async (data) => {
    return await get().createItem<Visitor>('visitors', '/visitors', data);
  },

  fetchAttendance: async () => {
    await get().fetchCollection<AttendanceRecord>('attendanceRecords', '/attendance');
  },

  createAttendanceRecord: async (data) => {
    return await get().createItem<AttendanceRecord>('attendanceRecords', '/attendance', data);
  },
}));
