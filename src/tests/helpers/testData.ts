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

// This helper assumed a Payload collection 'libraries', which does not exist.
// Remove it (or keep it only for future use but DO NOT call it from tests).
// export async function createTestLibrary(...) { ... }

export async function createTestItem(payload: Payload, ownerId: string, overrides: any = {}) {
  return await payload.create({
    collection: 'items',
    data: {
      thing_id: ID.generate().toString(),
      title: overrides.title || 'Test Item',
      description: overrides.description || 'A test item',
      // For now we use the admin user as the owner; adjust to match your Items schema.
      owner: ownerId,
      status: 'AVAILABLE',
      storage_location: {
        street_address: '456 Storage St',
        city: 'TestCity',
        state: 'TS',
        zip_code: '12345',
        country: 'US',
      },
      ...overrides,
    },
  });
}

export async function cleanupTestData(
  payload: Payload | null | undefined,
  collections: string[] = ['users', 'items', 'loans'], // removed 'libraries'
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
