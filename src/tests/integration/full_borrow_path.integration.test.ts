import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestPayload, cleanupPayload } from '../setup/integration.setup';
import { createTestUser, cleanupTestData, createTestLibrary } from '../helpers/testData';
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
      let lenderUser: any;
      let borrowerUser: any;
      let library: any;
      let drillItem: any;
      let activeLoan: any;

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
        library = await createTestLibrary(payload, adminUser.id, {
          name: 'Integration Test Library',
        });

        expect(library.id).toBeDefined();
        expect(library.name).toBe('Integration Test Library');

        // In Payload, relationship fields can be an array of IDs or objects.
        // When creating, we passed [adminUser.id], so it should be there.
        const adminIds = library.administrators.map((admin: any) =>
          typeof admin === 'object' ? admin.id : admin
        );
        expect(adminIds).toContain(adminUser.id);

        const listResult = await payload.find({
          collection: 'distributedLibraries',
        });

        const found = listResult.docs.find(doc => doc.id === library.id);
        expect(found).toBeDefined();
        expect(found?.name).toBe('Integration Test Library');
      });

      it('3. create a lender user and join library', async () => {
        lenderUser = await createTestUser(payload, {
          email: 'lender@example.com',
          password: 'lenderPassword123!',
          name: 'Lender User',
        });

        expect(lenderUser.id).toBeDefined();

        // Lender joins the library
        // Since we are using Payload, we update the library's members field
        await payload.update({
          collection: 'distributedLibraries',
          id: library.id,
          data: {
            members: [lenderUser.id],
          },
        });

        // Verify the lender is in the members list
        const updatedLibrary = await payload.findByID({
          collection: 'distributedLibraries',
          id: library.id,
        });

        const memberIds = (updatedLibrary.members || []).map((m: any) =>
          typeof m === 'object' ? m.id : m
        );
        expect(memberIds).toContain(lenderUser.id);
      });

      it('4. create an item belonging to lender user', async () => {
        // 4a. Lender creates an item
        drillItem = await (await import('../helpers/testData')).createTestItem(payload, lenderUser.id, {
          name: 'Lender Drill',
          description: 'A heavy-duty drill for integration testing',
          borrowingTime: 5,
        })

        expect(drillItem.id).toBeDefined()
        expect(drillItem.offeredBy).toBeDefined()

        // 4b. Add the item to the distributed library
        await payload.update({
          collection: 'distributedLibraries',
          id: library.id,
          data: {
            items: [drillItem.id],
          },
        })

        // 4c. Verify the library now includes the item
        const libWithItems = await payload.findByID({
          collection: 'distributedLibraries',
          id: library.id,
        })

        const itemIds = (libWithItems.items || []).map((it: any) =>
          typeof it === 'object' ? it.id : it
        )
        expect(itemIds).toContain(drillItem.id)

        // 4d. Verify item status is AVAILABLE (READY in domain/enum terms)
        const itemDoc = await payload.findByID({ collection: 'items', id: drillItem.id })
        expect(itemDoc.status).toBe('READY')
      });

      it('5. create a borrower user and join library', async () => {
        borrowerUser = await createTestUser(payload, {
          email: 'borrower@example.com',
          password: 'borrowerPassword123!',
          name: 'Borrower User',
        });

        expect(borrowerUser.id).toBeDefined();

        // Borrower joins the library (add to members list)
        // We already have lenderUser.id in the members list from test #3
        // So we need to add borrowerUser.id to the existing list
        const currentLibrary = await payload.findByID({
          collection: 'distributedLibraries',
          id: library.id,
        });

        const existingMemberIds = (currentLibrary.members || []).map((m: any) =>
          typeof m === 'object' ? m.id : m
        );

        await payload.update({
          collection: 'distributedLibraries',
          id: library.id,
          data: {
            members: [...existingMemberIds, borrowerUser.id],
          },
        });

        // Verify both lender and borrower are in the members list
        const updatedLibrary = await payload.findByID({
          collection: 'distributedLibraries',
          id: library.id,
        });

        const memberIds = (updatedLibrary.members || []).map((m: any) =>
          typeof m === 'object' ? m.id : m
        );
        expect(memberIds).toContain(lenderUser.id);
        expect(memberIds).toContain(borrowerUser.id);
      });

      it('6. borrower gets item', async () => {
        // 6a. Borrower searches for the item
        const searchResult = await payload.find({
          collection: 'items',
          where: {
            name: { equals: 'Lender Drill' },
          },
        })
        expect(searchResult.totalDocs).toBe(1)
        const foundItem = searchResult.docs[0]
        expect(foundItem).toBeDefined()
        expect(foundItem!.id).toBe(drillItem.id)

        // 6b. Borrower starts borrowing item
        // Note: we must pass the user in req to trigger the borrower-specific logic in hooks
        await payload.update({
          collection: 'items',
          id: drillItem.id,
          data: {
            status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW',
          },
          req: { user: borrowerUser } as any,
        })

        // Verify status is now WAITING_FOR_LENDER_APPROVAL_TO_BORROW
        const itemAfterRequest = await payload.findByID({ collection: 'items', id: drillItem.id })
        expect(itemAfterRequest.status).toBe('WAITING_FOR_LENDER_APPROVAL_TO_BORROW')
        expect(itemAfterRequest.requestedToBorrowBy).toBeDefined()

        // 6c. Lender approves the loan
        await payload.update({
          collection: 'items',
          id: drillItem.id,
          data: {
            status: 'BORROWED',
          },
          req: { user: lenderUser } as any,
        })

        // Verify status is now BORROWED
        const itemAfterApproval = await payload.findByID({ collection: 'items', id: drillItem.id })
        expect(itemAfterApproval.status).toBe('BORROWED')

        // 6d. Verify the Loan record was automatically created by the afterChange hook
        const loanSearch = await payload.find({
          collection: 'loans',
          where: {
            item: { equals: drillItem.id },
            borrower: { equals: borrowerUser.id },
            status: { equals: 'BORROWED' },
          },
        })
        expect(loanSearch.totalDocs).toBe(1)
        activeLoan = loanSearch.docs[0]
        expect(activeLoan.id).toBeDefined()
        expect(activeLoan.due_date).toBeDefined()
      });

      it('7. borrower returns item', async () => {
        // 7a. Borrower starts to return
        await payload.update({
          collection: 'loans',
          id: activeLoan.id,
          data: {
            status: 'RETURN_STARTED',
          },
          req: { user: borrowerUser } as any,
        })

        // 7b. Lender approves return
        await payload.update({
          collection: 'loans',
          id: activeLoan.id,
          data: {
            status: 'RETURNED',
          },
          req: { user: lenderUser } as any,
        })

        // Update the item status back to READY (triggers hook to mark any remaining active loans as RETURNED)
        await payload.update({
          collection: 'items',
          id: drillItem.id,
          data: {
            status: 'READY',
          },
          req: { user: lenderUser } as any,
        })

        // 7c. Borrower searches for the item
        const searchResult = await payload.find({
          collection: 'items',
          where: {
            name: { equals: 'Lender Drill' },
          },
        })

        // 7d. Item is listed as available again (READY)
        expect(searchResult.totalDocs).toBe(1)
        const returnedItem = searchResult.docs[0]
        expect(returnedItem).toBeDefined()
        expect(returnedItem!.status).toBe('READY')
      });
    });
