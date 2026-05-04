import type { Payload } from 'payload';
import { ID } from '@/domain';

export async function createTestUser(payload: Payload, overrides: any = {}) {
  return await payload.create({
    collection: 'users',
    data: {
      email: overrides.email || `test-${ID.generate().toString()}@example.com`,
      password: overrides.password || 'testPassword123!',
      name: overrides.name || 'Test User',
      ...overrides,
    },
  });
}

export async function createTestLibrary(payload: Payload, adminId: string, overrides: any = {}) {
  return await payload.create({
    collection: 'distributedLibraries',
    data: {
      library_id: ID.generate().toString(),
      name: overrides.name || 'Test Library',
      administrators: [adminId],
      default_loan_time_days: overrides.default_loan_time_days || 14,
      area: {
        radius_kilometers: 10,
        ...overrides.area,
      },
      ...overrides,
    },
  });
}

export async function createTestItem(payload: Payload, ownerId: string, overrides: any = {}) {
  const user = await payload.findByID({
    collection: 'users',
    id: ownerId,
  })

  // Create a dummy media item for the primary image
  const media = await payload.create({
    collection: 'media',
    req: { user } as any,
    data: {
      alt: 'Test Image',
    },
    // Mock the file upload
    file: {
      data: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
      name: 'test.png',
      mimetype: 'image/png',
      size: 68,
    },
  })

  return await payload.create({
    collection: 'items',
    req: { user } as any,
    data: {
      name: overrides.name || 'Test Item',
      description: overrides.description ?? 'A test item',
      rulesForUse: overrides.rulesForUse || 'Use with care during tests.',
      borrowingTime: overrides.borrowingTime ?? 7,
      offeredBy: ownerId,
      primaryImage: media.id,
      ...overrides,
    },
  });
}

export async function cleanupTestData(
  payload: Payload | null | undefined,
  collections: string[] = ['loans', 'items', 'media', 'distributedLibraries', 'users'],
) {
  if (!payload) {
    console.warn('Payload instance not available for cleanup');
    return;
  }

  const db = (payload as any).db;
  const isPostgres = db?.name === 'postgres' || !!db?.drizzle;

  if (isPostgres && db.drizzle) {
    // Use raw SQL with TRUNCATE CASCADE to handle FK constraints in Postgres
    try {
      // Map Payload collection slugs to Postgres table names
      const tableNames = collections.map((c) => c.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''));
      // Also truncate internal Payload tables that may hold FK references
      const allTables = [...new Set([
        'payload_locked_documents', 'payload_locked_documents_rels',
        'payload_preferences', 'payload_preferences_rels',
        ...tableNames,
      ])];
      const query = `TRUNCATE TABLE ${allTables.map((t) => `"${t}"`).join(', ')} CASCADE`;
      // Use the underlying pool to run raw SQL
      await db.pool.query(query);
    } catch (e: any) {
      console.warn('Postgres TRUNCATE failed, falling back to per-doc delete:', e?.message);
      await deleteDocsOneByOne(payload, collections);
    }
  } else {
    await deleteDocsOneByOne(payload, collections);
  }
}

async function deleteDocsOneByOne(payload: Payload, collections: string[]) {
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
