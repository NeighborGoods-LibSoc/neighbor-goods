import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestPayload, cleanupPayload } from '../setup/integration.setup';
import { createTestUser, createTestItem, cleanupTestData } from '../helpers/testData';
import type { Payload } from 'payload';
import { ID, LoanStatus } from '@/domain';

describe('Loans API Integration Tests', () => {
  let payload: Payload;
  let testAdmin: any;
  let testBorrower: any;
  let testItem: any;

  beforeAll(async () => {
    payload = await getTestPayload();
  });

  afterAll(async () => {
    await cleanupTestData(payload);
    await cleanupPayload();
  });

  beforeEach(async () => {
    await cleanupTestData(payload);

    testAdmin = await createTestUser(payload, {
      email: 'admin@test.com',
      name: 'Test Admin',
    });

    testBorrower = await createTestUser(payload, {
      email: 'borrower@test.com',
      name: 'Test Borrower',
    });

    // No Payload 'libraries' collection; use admin as the owner for now.
    testItem = await createTestItem(payload, testAdmin.id, {
      title: 'Test Ladder',
      description: 'A ladder for testing',
    });
  });

  it('should create a loan when borrowing an item', async () => {
    const dueDate = new Date(Date.now() + 7 * 86400000);

    const loan = await payload.create({
      collection: 'loans',
      data: {
        loan_id: ID.generate().toString(),
        item: testItem.id,
        borrower: testBorrower.id,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'BORROWED',
      },
    });

    expect(loan).toBeDefined();
    expect(loan.status).toBe('BORROWED');
    expect(loan.item).toBe(testItem.id);
    expect(loan.borrower).toBe(testBorrower.id);
  });

  it('should update loan status to WAITING_ON_LENDER_ACCEPTANCE when starting return', async () => {
    const loan = await payload.create({
      collection: 'loans',
      data: {
        loan_id: ID.generate().toString(),
        item: testItem.id,
        borrower: testBorrower.id,
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'BORROWED',
      },
    });

    const updated = await payload.update({
      collection: 'loans',
      id: loan.id,
      data: {
        status: 'WAITING_ON_LENDER_ACCEPTANCE',
        time_returned: new Date().toISOString(),
      },
    });

    expect(updated.status).toBe('WAITING_ON_LENDER_ACCEPTANCE');
    expect(updated.time_returned).toBeDefined();
  });

  it('should automatically mark loan as OVERDUE when past due date', async () => {
    const pastDate = new Date(Date.now() - 7 * 86400000);

    const loan = await payload.create({
      collection: 'loans',
      data: {
        loan_id: ID.generate().toString(),
        item: testItem.id,
        borrower: testBorrower.id,
        due_date: pastDate.toISOString().split('T')[0],
        status: 'BORROWED',
      },
    });

    const retrieved = await payload.findByID({
      collection: 'loans',
      id: loan.id,
    });

    expect(retrieved.status).toBe('OVERDUE');
  });

  it('should retrieve all loans for a specific borrower', async () => {
    await payload.create({
      collection: 'loans',
      data: {
        loan_id: ID.generate().toString(),
        item: testItem.id,
        borrower: testBorrower.id,
        status: 'BORROWED',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      },
    });

    const { docs } = await payload.find({
      collection: 'loans',
      where: {
        borrower: {
          equals: testBorrower.id,
        },
      },
    });

    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every(loan => loan.borrower === testBorrower.id)).toBe(true);
  });
});

import type { Payload } from 'payload';
import { ID } from '@/domain';

export async function createTestUser(payload: Payload, overrides: any = {}) {
  return await payload.create({
    collection: 'users',
    data: {
      email: overrides.email || `test-${ID.generate()}@example.com`,
      password: overrides.password || 'testPassword123!',
      name: overrides.name || 'Test User',
      ...overrides,
    },
  });
}

export async function createTestItem(payload: Payload, ownerId: string, overrides: any = {}) {
  return await payload.create({
    collection: 'items',
    data: {
      // Required by Items collection
      name: overrides.name || 'Test Item',
      description: overrides.description ?? 'A test item',
      rulesForUse: overrides.rulesForUse || 'Use with care during tests.',
      borrowingTime: overrides.borrowingTime ?? 7, // days
      contributedBy: overrides.contributedBy || ownerId,
      // primaryImage will be optional in tests (see Items.ts change)

      // Any extra fields you want for tests can go here
      ...overrides,
    },
  });
}

export async function cleanupTestData(
  payload: Payload | null | undefined,
  collections: string[] = ['users', 'items', 'loans'],
) {
  if (!payload) {
    console.warn('Payload instance not available for cleanup');
    return;
  }

  for (const collection of collections) {
    try {
      const { docs } = await payload.find({
        collection: collection as any,
        limit: 1000,
      });

      for (const doc of docs) {
        await payload.delete({
          collection: collection as any,
          id: doc.id,
        });
      }
    } catch (e: any) {
      if (!e?.message?.includes('not found')) {
        console.warn(`Could not clean ${collection}:`, e?.message || e);
      }
    }
  }
}
