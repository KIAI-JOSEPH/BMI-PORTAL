/**
 * Dashboard — smoke tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ── Store mocks ───────────────────────────────────────────────────────────────
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn((selector: any) =>
    selector({ user: { name: 'Test User', role: 'admin' } }),
  ),
}));

vi.mock('../stores/dataStore', () => ({
  useDataStore: vi.fn((selector: any) =>
    selector({
      students: [],
      transactions: [],
      addStudent: vi.fn(),
      addTransaction: vi.fn(),
      getStats: () => ({ students: 0, admissions: 0, tuition: 0, events: 5 }),
    }),
  ),
}));

import Dashboard from './Dashboard';

describe('Dashboard', () => {
  it('renders the Executive Dashboard heading', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText(/executive dashboard/i)).toBeInTheDocument();
  });

  it('renders the four stat cards', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText(/total students/i)).toBeInTheDocument();
    expect(screen.getByText(/ytd revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/new admissions/i)).toBeInTheDocument();
    expect(screen.getByText(/upcoming events/i)).toBeInTheDocument();
  });

  it('shows the logged-in user name', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
  });
});
