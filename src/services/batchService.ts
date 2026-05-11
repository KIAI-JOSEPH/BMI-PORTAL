import { authFetch } from './authService';

const API_URL = '/api/v1';

export type BatchResult = {
  success: boolean;
  data?: {
    createdIds: string[];
    successCount: number;
    failureCount: number;
    errors: Array<{ index: number; error: string }>;
  };
  error?: string;
};

export async function postStudentBatch(items: unknown[]): Promise<BatchResult> {
  const res = await authFetch(`${API_URL}/batch/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return res.json();
}

export async function postGradeBatch(items: unknown[]): Promise<BatchResult> {
  const res = await authFetch(`${API_URL}/batch/grades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return res.json();
}

export async function postTransactionBatch(items: unknown[]): Promise<BatchResult> {
  const res = await authFetch(`${API_URL}/batch/finance/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return res.json();
}

export async function postCourseBatch(items: unknown[]): Promise<BatchResult> {
  const res = await authFetch(`${API_URL}/batch/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return res.json();
}
