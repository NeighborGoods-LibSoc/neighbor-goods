import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestPayload, cleanupPayload } from '../setup/integration.setup';
import { createTestUser, createTestItem, cleanupTestData } from '../helpers/testData';
import type { Payload } from 'payload';

/**
pseudocode of the full path

  1. create an admin user
    a. asset user can log in
  2. create a library with the admin user as admin
    a. library appears on listings of libraries
  3. create a lender user
    a. lender user joins the library
    b. list library members as an admin
      1. the lender appears
  4. create an item belonging to the lender user
    a. lender user adds the item to the library
    b. library items include the item
      1. status is AVAILABLE
  5. create a borrower user
    a. borrower user joins the library
    b. list library members as an admin
      1. borrower and lender appear
  6. the borrower gets the item
    a. the borrower searches for the item and finds the item
    b. borrower starts borrowing item
    c. lender approves the loan
  7. borrower returns item
    a. borrower starts return
    b. lender approves return
    c. borrower searches for the item
    d. item is listed as available again
**/

describe("Full Borrow Happy Path Integration Test", () => {
      let payload: Payload;
      let adminUser: any;
      let library: any;
      let lender: any;
      let borrower: any;
      let item: any;

      beforeAll(async () => {
        payload = await getTestPayload();
      });

      afterAll(async () => {
        await cleanupTestData(payload);
        await cleanupPayload();
      });

      it('create an admin user', async () => {
            adminUser = await createTestUser(payload, {
              email: 'admin@example.com',
              password: 'adminPassword123!',
              name: 'Admin User',
            });

            expect(adminUser.id).toBeDefined();
            expect(adminUser.email).toBe('admin@example.com');

            const loginResult = await payload.login({
              collection: 'users',
              data: {
                email: 'admin@example.com',
                password: 'adminPassword123!',
              },
            });

            expect(loginResult.token).toBeDefined();
            expect(loginResult.user.id).toBe(adminUser.id);
              });

              it('2. create a library with the admin user as admin', async () => {
                // TODO: Implementation for: create library, verify in listings
              });

          it('3. create a lender user and join library', async () => {
            // Implementation for: create lender, join the library, list members
          });

      it('4. create an item belonging to lender user', async () => {
        // Implementation for: create item, add to the library, check status AVAILABLE
      });

      it('5. create a borrower user and join library', async () => {
        // Implementation for: create borrower, join the library, list members (verify both)
      });

      it('6. borrower gets item', async () => {
        // Implementation for: search, borrow request, lender approval
      });

      it('7. borrower returns item', async () => {
        // Implementation for: start return, approve return, search (verify available)
      });
    });
