import { test as setup, expect } from '@playwright/test'

// Runs once before the test projects (wired via `dependencies` in
// playwright.config.ts). It populates the database with the minimal fixtures
// the specs need by calling the gated test-only seed endpoint, which executes
// inside the Next/Payload server where module resolution works correctly.
setup('seed e2e fixtures', async ({ request }) => {
  const response = await request.post('/api/test-seed')
  expect(
    response.ok(),
    `Expected /api/test-seed to succeed, got HTTP ${response.status()}: ${await response.text()}`,
  ).toBeTruthy()

  const data = await response.json()
  expect(data.success).toBeTruthy()
})
