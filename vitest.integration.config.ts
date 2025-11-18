
import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test file
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    name: 'integration',
    include: ['**/*.integration.test.ts', '**/*.integration.test.tsx'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['./src/tests/setup/integration.setup.ts'],
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
});
