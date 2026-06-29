import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load the test environment (Postgres URI, Payload secret, disabled email, ...).
// The Payload config always uses the Postgres adapter, so the e2e web server must
// be given a Postgres connection string — not a MongoDB one.
dotenv.config({ path: path.resolve(__dirname, '.env.test'), quiet: true })

const E2E_PORT = process.env.E2E_PORT ?? '3100'
const baseURL = `http://localhost:${E2E_PORT}`

/**
 * Guard against a stale dev server "blocking launch".
 *
 * The e2e web server needs a very specific environment (test Postgres DB,
 * ENABLE_TEST_SEED, NEXT_DIST_DIR=.next-e2e, ...). A leftover server from a
 * previous, crashed, or misconfigured run that is still squatting on the e2e
 * port is therefore never safe to reuse: Playwright would either reuse it
 * (locally, where `reuseExistingServer` is on) or refuse to start because the
 * port is busy (in CI). Both manifest as the same recurring failure.
 *
 * This runs at config load — the earliest possible hook, before Playwright
 * decides whether to reuse/launch the web server. It probes the port's health
 * via the DB-backed `/api/browse` endpoint and, only if the occupant is NOT a
 * healthy e2e server, kills it so a fresh, correctly-configured server can
 * launch. A healthy server (e.g. one from an in-progress run) is left alone, so
 * test discovery/listing never disturbs an active run.
 */
function freeStaleE2EServer(port: string): void {
  const sh = (cmd: string): string => {
    try {
      return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return ''
    }
  }

  // Probe the DB-backed health endpoint. `000` (or empty) means nothing is
  // listening; `200` means a healthy e2e server is already up (allow reuse).
  const health = (): string =>
    sh(`curl -s -o /dev/null -m 4 -w "%{http_code}" "http://localhost:${port}/api/browse?limit=1" || true`)

  const initial = health()
  if (initial === '' || initial === '000' || initial === '200') return

  // Something unhealthy is holding the port — terminate it.
  // eslint-disable-next-line no-console
  console.log(
    `[e2e] Port ${port} is held by an unhealthy/stale server (HTTP ${initial}); terminating it so a fresh one can launch...`,
  )
  const pids = sh(`lsof -ti tcp:${port} || true`)
  if (pids) {
    for (const pid of pids.split(/\s+/).filter(Boolean)) {
      sh(`kill ${pid} || true`)
    }
  } else {
    // Fall back to fuser if lsof is unavailable.
    sh(`fuser -k ${port}/tcp || true`)
  }

  // Wait (synchronously) for the port to free up so Playwright starts fresh.
  for (let i = 0; i < 20; i++) {
    const code = health()
    if (code === '' || code === '000') return
    sh('sleep 0.5')
  }
}

freeStaleE2EServer(E2E_PORT)

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
    // Seeds the test database via the gated /api/test-seed endpoint before the
    // browser projects run (it executes inside the running web server).
    { name: 'setup', testMatch: /seed\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
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
      // Enables the test-only /api/test-seed endpoint used by e2e/seed.setup.ts.
      ENABLE_TEST_SEED: 'true',
      // Server-side helpers (e.g. getClientSideURL) use this to make internal
      // fetches such as /api/users/me. It must point at the e2e server's port,
      // otherwise those requests hit the wrong port and users appear logged out.
      NEXT_PUBLIC_SERVER_URL: baseURL,
    },
  },
})
