import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getTestPayload, cleanupPayload } from '../setup/integration.setup'
import { createTestUser, createTestItem, cleanupTestData } from '../helpers/testData'
import type { Payload } from 'payload'

describe('Notifications Integration Test', () => {
  let payload: Payload
  let lenderUser: any
  let borrowerUser: any

  beforeAll(async () => {
    payload = await getTestPayload()

    lenderUser = await createTestUser(payload, {
      email: 'notif-lender@example.com',
      password: 'lenderPass123!',
      name: 'Notif Lender',
    })

    borrowerUser = await createTestUser(payload, {
      email: 'notif-borrower@example.com',
      password: 'borrowerPass123!',
      name: 'Notif Borrower',
    })
  })

  afterAll(async () => {
    await cleanupTestData(payload, [
      'notifications',
      'borrow-requests',
      'loans',
      'items',
      'media',
      'users',
    ])
    await cleanupPayload()
  })

  it('should notify the lender when a borrower requests to borrow an item', async () => {
    const item = await createTestItem(payload, lenderUser.id, {
      name: 'Request Notify Drill',
      description: 'A drill for testing request notifications',
      borrowingTime: 7,
    })

    // Borrower requests to borrow the item
    await payload.update({
      collection: 'items',
      id: item.id,
      data: {
        status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW',
      },
      req: { user: borrowerUser } as any,
    })

    // Check that the item status changed
    const updatedItem = await payload.findByID({ collection: 'items', id: item.id })
    expect(updatedItem.status).toBe('WAITING_FOR_LENDER_APPROVAL_TO_BORROW')

    // Check that a notification was created for the lender
    const lenderNotifications = await payload.find({
      collection: 'notifications',
      where: {
        recipient: { equals: lenderUser.id },
        type: { equals: 'borrow_request' },
        item: { equals: item.id },
      },
    })

    expect(lenderNotifications.totalDocs).toBe(1)
    const notification = lenderNotifications.docs[0]!
    expect(notification.message).toContain('Notif Borrower')
    expect(notification.message).toContain('Request Notify Drill')
    expect(notification.read).toBe(false)
    expect(notification.actionURL).toBe(`/items/${item.id}`)

    // triggeredBy should reference the borrower
    const triggeredById =
      typeof notification.triggeredBy === 'object'
        ? notification.triggeredBy?.id
        : notification.triggeredBy
    expect(triggeredById).toBe(borrowerUser.id)
  })

  it('should notify the borrower when the lender approves the request', async () => {
    const item = await createTestItem(payload, lenderUser.id, {
      name: 'Approve Notify Drill',
      description: 'A drill for testing approval notifications',
      borrowingTime: 7,
    })

    // Borrower requests
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW' },
      req: { user: borrowerUser } as any,
    })

    // Lender approves by setting status to BORROWED
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'BORROWED' },
      req: { user: lenderUser } as any,
    })

    const updatedItem = await payload.findByID({ collection: 'items', id: item.id })
    expect(updatedItem.status).toBe('BORROWED')

    // Check that an approval notification was created for the borrower
    const borrowerNotifications = await payload.find({
      collection: 'notifications',
      where: {
        recipient: { equals: borrowerUser.id },
        type: { equals: 'borrow_approved' },
        item: { equals: item.id },
      },
    })

    expect(borrowerNotifications.totalDocs).toBe(1)
    const notification = borrowerNotifications.docs[0]!
    expect(notification.message).toContain('approved')
    expect(notification.message).toContain('Approve Notify Drill')
    expect(notification.read).toBe(false)
    expect(notification.actionURL).toBe(`/items/${item.id}`)
  })

  it('should notify the borrower when the lender rejects a request', async () => {
    const item = await createTestItem(payload, lenderUser.id, {
      name: 'Reject Notify Drill',
      description: 'A drill for testing rejection notifications',
      borrowingTime: 7,
    })

    // Borrower requests
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW' },
      req: { user: borrowerUser } as any,
    })

    // Lender rejects by setting status back to READY
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'READY' },
      req: { user: lenderUser } as any,
    })

    // Check that a rejection notification was created for the borrower
    const borrowerNotifications = await payload.find({
      collection: 'notifications',
      where: {
        recipient: { equals: borrowerUser.id },
        type: { equals: 'borrow_rejected' },
        item: { equals: item.id },
      },
    })

    expect(borrowerNotifications.totalDocs).toBe(1)
    const notification = borrowerNotifications.docs[0]!
    expect(notification.message).toContain('declined')
    expect(notification.message).toContain('Reject Notify Drill')
    expect(notification.read).toBe(false)
  })

  it('should notify the borrower when the lender reserves the item', async () => {
    const item = await createTestItem(payload, lenderUser.id, {
      name: 'Reserve Notify Drill',
      description: 'A drill for testing reservation notifications',
      borrowingTime: 7,
    })

    // Borrower requests
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW' },
      req: { user: borrowerUser } as any,
    })

    // Lender reserves the item
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'RESERVED' },
      req: { user: lenderUser } as any,
    })

    const updatedItem = await payload.findByID({ collection: 'items', id: item.id })
    expect(updatedItem.status).toBe('RESERVED')

    // Check that a reservation notification was created for the borrower
    const borrowerNotifications = await payload.find({
      collection: 'notifications',
      where: {
        recipient: { equals: borrowerUser.id },
        type: { equals: 'borrow_approved' },
        item: { equals: item.id },
      },
    })

    expect(borrowerNotifications.totalDocs).toBe(1)
    const notification = borrowerNotifications.docs[0]!
    expect(notification.message).toContain('reserved')
    expect(notification.message).toContain('Reserve Notify Drill')
  })
})
