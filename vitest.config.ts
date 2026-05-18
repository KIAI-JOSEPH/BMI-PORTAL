import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/**/*.d.ts',
      'src/vite-env.d.ts',
      'src/test/**',
      // NOTE: src/grading/** is intentionally INCLUDED in coverage.
      // The grading module contains GPA calculators, grade engines, and ECTS
      // converters that directly affect student academic records. Coverage is
      // mandatory. Do not add it back to this exclusion list.
    ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
