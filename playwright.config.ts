import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load the test environment (Postgres URI, Payload secret, disabled email, ...).
// The Payload config always uses the Postgres adapter, so the e2e web server must
// be given a Postgres connection string — not a MongoDB one.
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

const E2E_PORT = process.env.E2E_PORT ?? '3100'
const baseURL = `http://localhost:${E2E_PORT}`

const DATABASE_URI =
  process.env.DATABASE_URI ?? 'postgresql://neighborgoods:neighborgoods@localhost:5432/neighbor-goods-test'
const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET ?? 'test-secret-key-for-integration-tests-change-me-in-production'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  globalSetup: './e2e/global-setup.ts',
  webServer: {
    command: `./node_modules/.bin/next dev --port ${E2E_PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-deprecation',
      NEXT_DIST_DIR: '.next-e2e',
      DATABASE_URI,
      PAYLOAD_SECRET,
      DISABLE_EMAIL_FOR_TESTS: 'true',
    },
  },
})
