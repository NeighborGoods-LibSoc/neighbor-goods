import net from 'net'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load the same test env the web server uses so we resolve the right DB target.
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') })

const DEFAULT_URI = 'postgresql://neighborgoods:neighborgoods@localhost:5432/neighbor-goods-test'
const CONTAINER_NAME = 'ng-e2e-postgres'
const POSTGRES_IMAGE = 'postgres:16-alpine'

interface PgTarget {
  host: string
  port: number
  user: string
  password: string
  database: string
}

function parseDatabaseUri(uri: string): PgTarget {
  const url = new URL(uri)
  return {
    host: url.hostname || 'localhost',
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username) || 'neighborgoods',
    password: decodeURIComponent(url.password) || 'neighborgoods',
    database: url.pathname.replace(/^\//, '') || 'neighbor-goods-test',
  }
}

function canConnect(host: string, port: number, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const done = (result: boolean) => {
      socket.destroy()
      resolve(result)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(port, host)
  })
}

function dockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function startPostgresContainer(target: PgTarget): void {
  // Remove any stale container with the same name, then start a fresh one
  // whose credentials match the configured DATABASE_URI.
  try {
    execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'ignore' })
  } catch {
    // ignore – container may not exist
  }

  const cmd = [
    'docker run -d',
    `--name ${CONTAINER_NAME}`,
    `-p ${target.port}:5432`,
    `-e POSTGRES_USER=${target.user}`,
    `-e POSTGRES_PASSWORD=${target.password}`,
    `-e POSTGRES_DB=${target.database}`,
    POSTGRES_IMAGE,
  ].join(' ')

  execSync(cmd, { stdio: 'ignore' })
}

async function waitForPostgres(target: PgTarget, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    if (await canConnect(target.host, target.port)) {
      // Give the server a brief moment to finish initializing on a cold start.
      await new Promise((r) => setTimeout(r, 1000))
      return
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(
    `Timed out waiting for Postgres at ${target.host}:${target.port}. ` +
      `Ensure a Postgres instance matching DATABASE_URI is running.`,
  )
}

async function globalSetup(): Promise<void> {
  const uri = process.env.DATABASE_URI ?? DEFAULT_URI
  const target = parseDatabaseUri(uri)

  // 1) Make sure a Postgres instance is reachable (start one via Docker if not).
  if (!(await canConnect(target.host, target.port))) {
    if (!dockerAvailable()) {
      throw new Error(
        `Cannot reach Postgres at ${target.host}:${target.port} and Docker is not available. ` +
          `Start a Postgres instance matching DATABASE_URI (${uri}) before running e2e tests.`,
      )
    }

    // eslint-disable-next-line no-console
    console.log(`[e2e] Starting Postgres container "${CONTAINER_NAME}" for tests...`)
    startPostgresContainer(target)
    await waitForPostgres(target)
  }

  // The schema is pushed automatically when the Next/Payload web server boots
  // (dev mode), and the minimal fixtures the specs rely on are seeded by the
  // "setup" Playwright project (e2e/seed.setup.ts) once the server is up — see
  // playwright.config.ts. We can't boot Payload here directly because its config
  // transitively imports Next-only modules (e.g. `next/cache`).
}

export default globalSetup
