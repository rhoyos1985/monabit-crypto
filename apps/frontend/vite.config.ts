/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      // Solo medir coverage de lógica de negocio: hooks, repositories y slices.
      // Se excluyen componentes UI (estilos + glue React), entrypoints y declaraciones.
      include: [
        'src/app/slices/**/*.ts',
        'src/features/*/application/**/*.ts',
        'src/features/*/infrastructure/**/*.ts',
        'src/features/dashboard/ui/CryptoTable.tsx',
        'src/features/auth/ui/LoginPage.tsx',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/test/**',
      ],
      thresholds: {
        statements: 95,
        functions: 95,
        lines: 95,
        branches: 70,
      },
    },
  },
});
