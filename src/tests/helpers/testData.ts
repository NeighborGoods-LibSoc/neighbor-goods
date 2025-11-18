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
      name: overrides.name || 'Test Item',
      description: overrides.description ?? 'A test item',
      rulesForUse: overrides.rulesForUse || 'Use with care during tests.',
      borrowingTime: overrides.borrowingTime ?? 7,
      contributedBy: overrides.contributedBy || ownerId,
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
