import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestPayload, cleanupPayload } from '../setup/integration.setup';
import { createTestUser, createTestItem, cleanupTestData } from '../helpers/testData';
import type { Payload } from 'payload';
import { ID } from '@/domain';

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

    testItem = await createTestItem(payload, testAdmin.id, {
      name: 'Test Ladder',
      description: 'A ladder for testing',
    });
  });

  it('should create users through API', async () => {
    expect(testAdmin).toBeDefined();
    expect(testAdmin.email).toBe('admin@test.com');
    expect(testBorrower).toBeDefined();
    expect(testBorrower.email).toBe('borrower@test.com');
  });

  it('should create items through API', async () => {
    expect(testItem).toBeDefined();
    expect(testItem.name).toBe('Test Ladder');
    expect(testItem.description).toBe('A ladder for testing');

    const itemId = typeof testItem.contributedBy === 'object'
      ? testItem.contributedBy.id
      : testItem.contributedBy;
    expect(itemId).toBe(testAdmin.id);
  });

  it('should query items by contributor', async () => {
    const { docs } = await payload.find({
      collection: 'items',
      where: {
        contributedBy: {
          equals: testAdmin.id,
        },
      },
    });

    expect(docs.length).toBeGreaterThan(0);
    const contributorIds = docs.map((item: any) =>
      typeof item.contributedBy === 'object' ? item.contributedBy.id : item.contributedBy,
    );
    expect(contributorIds.every(id => id === testAdmin.id)).toBe(true);
  });

  it.skip('Loan creation/status transitions require domain service methods', async () => {
    // Creating loans directly via Payload API triggers domain hooks that enforce
    // complex state machine rules. These are already tested in unit tests.
    // Integration tests for loans should use dedicated domain service endpoints
    // (e.g., POST /api/loans/borrow, POST /api/loans/return) once those are implemented.
  });
});


