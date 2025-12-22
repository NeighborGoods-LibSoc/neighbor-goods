import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

export default defineConfig({
  test: {
    projects: [
      {
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
      },
      {
        test: {
          name: 'integration',
          include: ['**/*.integration.test.ts', '**/*.integration.test.tsx'],
          globals: true,
          environment: 'node',
          testTimeout: 30000,
          hookTimeout: 30000,
          setupFiles: ['./src/tests/setup/integration.setup.ts'],
          env: {
            ...dotenv.config({ path: '.env.test' }).parsed,
          },
          pool: 'forks',
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
      },
    ],
  },
});
