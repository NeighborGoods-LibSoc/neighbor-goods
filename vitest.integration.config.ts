import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

export default defineConfig({
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
    // Vitest 4: pool options are now top-level
    isolate: false,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
