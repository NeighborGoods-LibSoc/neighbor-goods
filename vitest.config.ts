import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'unit',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/*.integration.test.ts',
      '**/*.integration.test.tsx',
    ],
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
