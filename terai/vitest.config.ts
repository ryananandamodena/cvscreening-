import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest config, deliberately separate from vite.config.ts's dev-server settings but sharing
// the same '@' alias so component imports resolve identically in tests and in the real build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false,
    // This repo has a stray archived Expo project under mobile/ (its own package.json/jest
    // config, unrelated to the real mobile app at the repo root) — scope test discovery to
    // this app's own tests/ directory so it's never picked up.
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'mobile/**', 'backend/**', 'frontend/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Coverage is a measurement, not a gate — no thresholds enforced here. See Module 11
      // report for the actual coverage numbers on security-critical modules/screens.
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
});
