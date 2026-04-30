import { defineConfig, devices } from '@playwright/test'

const E2E_PORT = process.env.E2E_PORT ?? '3100'
const baseURL = `http://localhost:${E2E_PORT}`

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
  webServer: {
    command: `./node_modules/.bin/cross-env NODE_OPTIONS=--no-deprecation NEXT_DIST_DIR=.next-e2e ./node_modules/.bin/next dev --port ${E2E_PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
