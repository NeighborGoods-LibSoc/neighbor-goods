import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestPayload, cleanupPayload } from '../setup/integration.setup';
import { createTestUser, cleanupTestData, createTestItem } from '../helpers/testData';
import type { Payload } from 'payload';

/**
 * Integration test for issue #74:
 * Attempting to borrow an item that is not READY should return a 409 error,
 * not a 500 internal server error.
 */
describe('Borrow Unavailable Item Integration Test', () => {
  let payload: Payload;
  let lenderUser: any;
  let borrowerUser: any;
  let anotherBorrower: any;
  let item: any;

  beforeAll(async () => {
    payload = await getTestPayload();

    lenderUser = await createTestUser(payload, {
      email: 'lender-unavail@example.com',
      password: 'lenderPassword123!',
      name: 'Lender User',
    });

    borrowerUser = await createTestUser(payload, {
      email: 'borrower-unavail@example.com',
      password: 'borrowerPassword123!',
      name: 'Borrower User',
    });

    anotherBorrower = await createTestUser(payload, {
      email: 'another-borrower-unavail@example.com',
      password: 'anotherPassword123!',
      name: 'Another Borrower',
    });

    item = await createTestItem(payload, lenderUser.id, {
      name: 'Unavailable Item Test Drill',
      borrowingTime: 7,
    });
  }, 120000);

  afterAll(async () => {
    await cleanupTestData(payload);
    await cleanupPayload();
  });

  it('item starts as READY', async () => {
    const doc = await payload.findByID({ collection: 'items', id: item.id });
    expect(doc.status).toBe('READY');
  });

  it('first borrower can request to borrow a READY item', async () => {
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW' },
      req: { user: borrowerUser } as any,
    });

    const doc = await payload.findByID({ collection: 'items', id: item.id });
    expect(doc.status).toBe('WAITING_FOR_LENDER_APPROVAL_TO_BORROW');
  });

  it('second borrower attempting to borrow a non-READY item receives a 409 error', async () => {
    await expect(
      payload.update({
        collection: 'items',
        id: item.id,
        data: { status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW' },
        req: { user: anotherBorrower } as any,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('lender approves the borrow request, item becomes BORROWED', async () => {
    await payload.update({
      collection: 'items',
      id: item.id,
      data: { status: 'BORROWED' },
      req: { user: lenderUser } as any,
    });

    const doc = await payload.findByID({ collection: 'items', id: item.id });
    expect(doc.status).toBe('BORROWED');
  });

  it('attempting to borrow a BORROWED item also receives a 409 error', async () => {
    await expect(
      payload.update({
        collection: 'items',
        id: item.id,
        data: { status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW' },
        req: { user: anotherBorrower } as any,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
