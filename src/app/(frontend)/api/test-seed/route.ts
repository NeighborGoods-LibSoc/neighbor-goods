import { getPayload } from 'payload'
import type { Payload } from 'payload'
import config from '@payload-config'

// Test-only endpoint used by the e2e suite (see e2e/seed.setup.ts) to populate
// the database with the minimal fixtures the specs rely on. It is gated behind
// the ENABLE_TEST_SEED flag so it can never run in a normal/production deploy.

const OWNER_EMAIL = 'owner@example.com'
const OWNER_PASSWORD = 'password123'
const BORROWER_EMAIL = 'neighbor@example.com'
const BORROWER_PASSWORD = 'password123'
// Dedicated borrower used by the item-borrow spec. Keeping it separate from the
// shared `neighbor@example.com` (used by several specs in parallel) avoids
// concurrent same-user logins, which race on Payload's auth session array and
// can intermittently invalidate tokens (item page renders as logged out).
const DEDICATED_BORROWER_EMAIL = 'borrower@example.com'
const DEDICATED_BORROWER_PASSWORD = 'password123'
// Dedicated users for the thing-request "Library Selection" spec. Because
// Playwright runs with `fullyParallel: true`, the tests in that file execute
// concurrently across workers; if they all logged in as the same user their
// simultaneous logins would race on Payload's auth session array and
// intermittently invalidate tokens, making `/items/request` render as logged
// out (it redirects to /login). Giving each test its own user removes the race.
const REQUEST_FORM_PASSWORD = 'password123'
const REQUEST_FORM_EMAILS = [
  'requester-1@example.com',
  'requester-2@example.com',
  'requester-3@example.com',
  'requester-4@example.com',
]

interface SeedUser {
  email: string
  password: string
  name: string
  verificationFlags?: string[]
}

let cachedMediaId: string | null = null

async function generateImageBuffer(): Promise<Buffer> {
  // The Media collection defines several image sizes, so we generate a real
  // (non-trivial) image to make sure sharp resizing succeeds.
  const sharp = (await import('sharp')).default
  return sharp({
    create: {
      width: 1200,
      height: 900,
      channels: 3,
      background: { r: 214, g: 188, b: 142 },
    },
  })
    .png()
    .toBuffer()
}

async function ensureMedia(payload: Payload): Promise<string> {
  if (cachedMediaId) return cachedMediaId

  const existing = await payload.find({ collection: 'media', limit: 1, overrideAccess: true })
  if (existing.docs[0]) {
    cachedMediaId = String(existing.docs[0].id)
    return cachedMediaId
  }

  const imageBuffer = await generateImageBuffer()
  const media = await payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt: 'Seed item image' },
    file: {
      data: imageBuffer,
      name: 'seed-item.png',
      mimetype: 'image/png',
      size: imageBuffer.length,
    },
  })
  cachedMediaId = String(media.id)
  return cachedMediaId
}

async function createReadyItem(payload: Payload, owner: { id: string | number }, name: string) {
  const mediaId = await ensureMedia(payload)
  return payload.create({
    collection: 'items',
    // Passing the owner as the request user makes the collection's
    // beforeChange hook set `offeredBy`/`owner_uuid` correctly.
    user: owner,
    overrideAccess: false,
    data: {
      name,
      status: 'READY',
      description: `A community ${name.toLowerCase()} available to borrow.`,
      borrowingTime: 7,
      borrowerVerification: [],
      primaryImage: mediaId,
    },
  })
}

async function ensureUser(payload: Payload, user: SeedUser) {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: user.email } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) return existing.docs[0]

  return payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      email: user.email,
      password: user.password,
      name: user.name,
      verificationFlags: user.verificationFlags ?? [],
    },
  })
}

export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  if (process.env.ENABLE_TEST_SEED !== 'true') {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    // Owner lends the items; kept separate from the borrower the specs log in
    // as, so that "Request to Borrow" is available to the logged-in test user.
    const owner = await ensureUser(payload, {
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      name: 'Olivia Owner',
    })

    // The borrower the e2e specs authenticate with.
    await ensureUser(payload, {
      email: BORROWER_EMAIL,
      password: BORROWER_PASSWORD,
      name: 'Nadia Neighbor',
    })

    // A dedicated borrower for the item-borrow spec (see note above).
    await ensureUser(payload, {
      email: DEDICATED_BORROWER_EMAIL,
      password: DEDICATED_BORROWER_PASSWORD,
      name: 'Bruno Borrower',
    })

    // One dedicated user per thing-request "Library Selection" test (see note
    // above) so their parallel logins never contend on the same auth session.
    let requesterIndex = 0
    for (const email of REQUEST_FORM_EMAILS) {
      requesterIndex += 1
      await ensureUser(payload, {
        email,
        password: REQUEST_FORM_PASSWORD,
        name: `Requester ${requesterIndex}`,
      })
    }

    // `?fresh=1` creates and returns a brand-new READY item. The borrow spec
    // uses this so parallel browser projects each mutate their own item and
    // never contend over the shared fixtures.
    if (searchParams.get('fresh') === '1') {
      const uniqueName = `Borrowable Item ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const item = await createReadyItem(payload, owner, uniqueName)
      return Response.json({ success: true, itemId: String(item.id) })
    }

    // Base fixtures: only seed items once – keep the endpoint idempotent.
    const existingItems = await payload.find({
      collection: 'items',
      limit: 1,
      overrideAccess: true,
    })

    if (existingItems.totalDocs === 0) {
      const itemNames = ['Cordless Drill', 'Garden Wheelbarrow']
      for (const name of itemNames) {
        await createReadyItem(payload, owner, name)
      }
    }

    return Response.json({ success: true })
  } catch (e) {
    console.error('Test seed error:', e)
    return new Response('Error seeding test data.', { status: 500 })
  }
}
