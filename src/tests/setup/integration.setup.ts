
import { getPayload } from 'payload';
import type { Payload } from 'payload';
import baseConfig from '@/payload.config';

let payloadInstance: Payload | null = null;

export async function getTestPayload(): Promise<Payload> {
  if (!payloadInstance) {
    // Ensure env is set (in case .env.test wasn't loaded for some reason)
    if (!process.env.PAYLOAD_SECRET) {
      process.env.PAYLOAD_SECRET = 'test-secret-key-for-integration-tests';
    }
    if (!process.env.DATABASE_URI) {
      process.env.DATABASE_URI = 'mongodb://localhost:27017/neighbor-goods-test';
    }

    // Use the real app config as-is
    payloadInstance = await getPayload({ config: baseConfig });
  }

  return payloadInstance;
}

export async function cleanupPayload(): Promise<void> {
  if (payloadInstance) {
    // In Vitest with singleFork: true, we might want to keep the payload instance
    // alive between test files to avoid re-initialization overhead and
    // potential connection issues.
    // If we really want to destroy it, we must ensure it's not reused.

    /*
    try {
      const anyPayload = payloadInstance as any;
      if (anyPayload.db && typeof anyPayload.db.destroy === 'function') {
        await anyPayload.db.destroy();
      }
    } catch (e) {
      console.warn('Error destroying payload instance:', e);
    }
    payloadInstance = null;
    */
  }
}

// Cleanup on process exit
process.on('beforeExit', async () => {
  await cleanupPayload();
});
