import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { getTestPayload, cleanupPayload } from '../setup/integration.setup'
import { createTestUser, cleanupTestData } from '../helpers/testData'
import type { Payload } from 'payload'
import { ID } from '@/domain'

describe('ThingRequests – Library Association Integration Tests', () => {
  let payload: Payload
  let memberUser: any
  let nonMemberUser: any
  let library: any

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  afterAll(async () => {
    await cleanupTestData(payload, ['thing-requests', 'libraries', 'users'])
    await cleanupPayload()
  })

  beforeEach(async () => {
    await cleanupTestData(payload, ['thing-requests', 'libraries', 'users'])

    memberUser = await createTestUser(payload, {
      email: 'member@test.com',
      name: 'Member User',
    })

    nonMemberUser = await createTestUser(payload, {
      email: 'nonmember@test.com',
      name: 'Non-Member User',
    })

    library = await payload.create({
      collection: 'libraries',
      data: {
        name: 'Test Library',
        library_id: ID.generate().toString(),
        administrators: [memberUser.id],
        members: [],
        waitingListType: 'NONE',
        maxFinesBeforeSuspension: { amount: 0, currency: 'USD' },
        feeSchedule: {
          feeForOverdueItem: { amount: 0, currency: 'USD' },
          feeForDamagedItem: { amount: 0, currency: 'USD' },
        },
        defaultLoanTime: 14,
        mopServer: { url: 'https://localhost', version: '0.0.0' },
      },
    })
  })

  it('should create a thing request with a valid library (user is admin)', async () => {
    const doc = await payload.create({
      collection: 'thing-requests',
      req: { user: memberUser, payload } as any,
      data: {
        name: 'Need a ladder',
        description: 'Looking for a tall ladder',
        libraries: [library.id],
      },
    })

    expect(doc).toBeDefined()
    expect(doc.name).toBe('Need a ladder')
    const libIds = (doc.libraries || []).map((l: any) => typeof l === 'object' ? l.id : l)
    expect(libIds).toContain(library.id)
  })

  it('should create a thing request with a valid library (user is member)', async () => {
    // Add nonMemberUser as a member of the library
    await payload.update({
      collection: 'libraries',
      id: library.id,
      data: {
        members: [nonMemberUser.id],
      },
    })

    const doc = await payload.create({
      collection: 'thing-requests',
      req: { user: nonMemberUser, payload } as any,
      data: {
        name: 'Need a drill',
        description: 'Looking for a power drill',
        libraries: [library.id],
      },
    })

    expect(doc).toBeDefined()
    expect(doc.name).toBe('Need a drill')
  })

  it('should reject a thing request when user is not a member of the library', async () => {
    await expect(
      payload.create({
        collection: 'thing-requests',
        req: { user: nonMemberUser, payload } as any,
        data: {
          name: 'Need a saw',
          libraries: [library.id],
        },
      }),
    ).rejects.toThrow(/must be a member/)
  })

  it('should reject a thing request with no libraries', async () => {
    await expect(
      payload.create({
        collection: 'thing-requests',
        req: { user: memberUser, payload } as any,
        data: {
          name: 'Need something',
          libraries: [],
        },
      }),
    ).rejects.toThrow()
  })

  it('should allow posting to multiple libraries the user belongs to', async () => {
    const library2 = await payload.create({
      collection: 'libraries',
      data: {
        name: 'Second Library',
        library_id: ID.generate().toString(),
        administrators: [memberUser.id],
        members: [],
        waitingListType: 'NONE',
        maxFinesBeforeSuspension: { amount: 0, currency: 'USD' },
        feeSchedule: {
          feeForOverdueItem: { amount: 0, currency: 'USD' },
          feeForDamagedItem: { amount: 0, currency: 'USD' },
        },
        defaultLoanTime: 14,
        mopServer: { url: 'https://localhost', version: '0.0.0' },
      },
    })

    const doc = await payload.create({
      collection: 'thing-requests',
      req: { user: memberUser, payload } as any,
      data: {
        name: 'Need a hammer',
        libraries: [library.id, library2.id],
      },
    })

    expect(doc).toBeDefined()
    const libIds = (doc.libraries || []).map((l: any) => typeof l === 'object' ? l.id : l)
    expect(libIds).toHaveLength(2)
    expect(libIds).toContain(library.id)
    expect(libIds).toContain(library2.id)
  })

  it('should reject when user belongs to one library but not another', async () => {
    const library2 = await payload.create({
      collection: 'libraries',
      data: {
        name: 'Restricted Library',
        library_id: ID.generate().toString(),
        administrators: [nonMemberUser.id],
        members: [],
        waitingListType: 'NONE',
        maxFinesBeforeSuspension: { amount: 0, currency: 'USD' },
        feeSchedule: {
          feeForOverdueItem: { amount: 0, currency: 'USD' },
          feeForDamagedItem: { amount: 0, currency: 'USD' },
        },
        defaultLoanTime: 14,
        mopServer: { url: 'https://localhost', version: '0.0.0' },
      },
    })

    await expect(
      payload.create({
        collection: 'thing-requests',
        req: { user: memberUser, payload } as any,
        data: {
          name: 'Need a wrench',
          libraries: [library.id, library2.id],
        },
      }),
    ).rejects.toThrow(/must be a member/)
  })

  it('should set requestedBy to the authenticated user automatically', async () => {
    const doc = await payload.create({
      collection: 'thing-requests',
      req: { user: memberUser, payload } as any,
      data: {
        name: 'Need a bike pump',
        requestedBy: nonMemberUser.id, // Try to spoof
        libraries: [library.id],
      },
    })

    const requestedById = typeof doc.requestedBy === 'object' ? doc.requestedBy.id : doc.requestedBy
    expect(requestedById).toBe(memberUser.id)
  })
})
