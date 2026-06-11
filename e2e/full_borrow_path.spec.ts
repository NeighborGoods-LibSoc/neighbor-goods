import { test, expect, Page } from '@playwright/test'

/**
 * End-to-end UI version of the "full borrow happy path".
 *
 * Mirrors src/tests/integration/full_borrow_path.integration.test.ts but drives
 * everything through the Payload site UI instead of the Payload API.
 *
 *   1. create an admin user (sign up + log in)
 *   2. admin creates a library; library appears in /libraries listing
 *   3. create a lender user; lender joins the library
 *   4. lender offers an item; item appears in /browse and is AVAILABLE
 *   5. create a borrower user; borrower joins the library
 *   6. borrower searches for the item, requests to borrow; lender approves
 *   7. borrower starts the return through the UI; lender confirms it;
 *      borrower then sees the item AVAILABLE again
 *
 * The whole flow shares the same browser context per user (cookie-based session),
 * so we use three independent contexts (admin, lender, borrower) within one test.
 */

// This spec is heavy and shares state across steps – run it on a single browser
// project to keep it stable and fast.
test.describe.configure({ mode: 'serial' })

const RUN_ID = Date.now().toString(36)
const ADMIN_EMAIL = `admin-${RUN_ID}@example.com`
const LENDER_EMAIL = `lender-${RUN_ID}@example.com`
const BORROWER_EMAIL = `borrower-${RUN_ID}@example.com`
const PASSWORD = 'Password123!'
const LIBRARY_NAME = `E2E Test Library ${RUN_ID}`
const ITEM_NAME = `E2E Test Drill ${RUN_ID}`

// 1x1 transparent PNG for the required image upload on the "offer item" form.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

async function signup(page: Page, name: string, email: string) {
  await page.goto('/signup')
  await page.locator('#name').fill(name)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('#password_confirm').fill(PASSWORD)
  await page.getByRole('button', { name: /Sign Up/i }).click()
  // Signup redirects to /login with a query message
  await page.waitForURL(/\/login/)
}

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(PASSWORD)
  await page.getByRole('button', { name: /Log In/i }).click()
  await page.waitForURL(/\/dashboard/)
}

async function signupAndLogin(page: Page, name: string, email: string) {
  await signup(page, name, email)
  await login(page, email)
}

test.describe('Full Borrow Happy Path (UI)', () => {
  // Skipped: flaky in current local env (browse search visibility). Re-enable once stabilized.
  test.skip('admin creates library, lender offers item, borrower borrows and returns it', async ({
    browser,
  }) => {
    test.slow() // multi-step flow involving page navigation and form submissions

    // Three independent browser contexts = three independent user sessions
    const adminCtx = await browser.newContext()
    const lenderCtx = await browser.newContext()
    const borrowerCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    const lenderPage = await lenderCtx.newPage()
    const borrowerPage = await borrowerCtx.newPage()

    try {
      // -----------------------------------------------------------------
      // 1. Create an admin user and assert they can log in
      // -----------------------------------------------------------------
      await signupAndLogin(adminPage, 'Admin User', ADMIN_EMAIL)
      // Sanity-check that we landed on the authenticated dashboard
      await expect(adminPage).toHaveURL(/\/dashboard/)

      // -----------------------------------------------------------------
      // 2. Admin creates a library; verify it appears in the listing
      // -----------------------------------------------------------------
      await adminPage.goto('/libraries/create')
      await adminPage.locator('#name').fill(LIBRARY_NAME)
      // defaultLoanTimeDays and radiusKilometers are pre-filled with defaults.
      await adminPage.getByRole('button', { name: /Create Library/i }).click()
      // Success dialog
      await expect(adminPage.getByText(/Library Created!/i)).toBeVisible()
      await expect(adminPage.getByText(LIBRARY_NAME)).toBeVisible()

      // 2a. Library appears on listings of libraries
      await adminPage.goto('/libraries')
      const adminLibraryCard = adminPage
        .locator('.card', { hasText: LIBRARY_NAME })
        .first()
      await expect(adminLibraryCard).toBeVisible()
      // Admin sees the "Administrator" badge on their own library
      await expect(adminLibraryCard.getByText(/Administrator/i)).toBeVisible()

      // -----------------------------------------------------------------
      // 3. Create a lender user; lender joins the library
      // -----------------------------------------------------------------
      await signupAndLogin(lenderPage, 'Lender User', LENDER_EMAIL)

      await lenderPage.goto('/libraries')
      const lenderLibraryCard = lenderPage
        .locator('.card', { hasText: LIBRARY_NAME })
        .first()
      await expect(lenderLibraryCard).toBeVisible()
      await lenderLibraryCard.getByRole('button', { name: /Join Library/i }).click()
      // After joining, the card should show "Joined"
      await expect(lenderLibraryCard.getByText(/Joined/i)).toBeVisible()

      // -----------------------------------------------------------------
      // 4. Lender offers an item; verify it appears available in /browse
      // -----------------------------------------------------------------
      await lenderPage.goto('/items/offer')
      await lenderPage.locator('#name').fill(ITEM_NAME)
      // Upload a tiny image so the required "picture" field is satisfied
      await lenderPage.locator('#picture').setInputFiles({
        name: 'drill.png',
        mimeType: 'image/png',
        buffer: TINY_PNG,
      })
      await lenderPage.locator('#description').fill('A heavy-duty drill for e2e testing')
      // The offer form requires at least one borrower verification method.
      // We use EMAIL (lowest friction) and grant the borrower the matching
      // verificationFlag via the Payload REST API below before they request
      // the item, so the "Request to Borrow" button is visible.
      await lenderPage.locator('#verification-EMAIL').click()
      await lenderPage.locator('#borrowingTime').fill('5')
      await lenderPage.locator('#agreeToTerms').click()
      await lenderPage.getByRole('button', { name: /Submit Item/i }).click()
      // Success modal
      await expect(lenderPage.getByText(/Item Created Successfully!/i)).toBeVisible()
      await lenderPage.getByRole('button', { name: /View Item/i }).click()
      await lenderPage.waitForURL(/\/items\/[^/]+/)

      // 4a. Verify item appears in browse and is Available (READY)
      await lenderPage.goto('/browse')
      await lenderPage.locator('input[placeholder*="Search"]').fill(ITEM_NAME)
      await lenderPage.getByRole('button', { name: /^Search$/ }).click()
      const browseCard = lenderPage.locator('a', { hasText: ITEM_NAME }).first()
      await expect(browseCard).toBeVisible()
      await expect(browseCard.getByText(/Available/i)).toBeVisible()

      // -----------------------------------------------------------------
      // 5. Create a borrower user; borrower joins the library
      // -----------------------------------------------------------------
      await signupAndLogin(borrowerPage, 'Borrower User', BORROWER_EMAIL)

      // Grant the borrower the EMAIL verification flag so they satisfy the
      // item's borrowerVerification requirements (otherwise the "Request to
      // Borrow" button is hidden behind a "Requirements missing" notice).
      // The /api/users/me endpoint returns the authenticated user; we then
      // PATCH /api/users/:id with the EMAIL flag. Users collection access
      // allows any logged-in user to update.
      {
        const meResp = await borrowerPage.request.get('/api/users/me')
        const me = await meResp.json()
        const borrowerId = me?.user?.id
        expect(borrowerId, 'borrower id from /api/users/me').toBeTruthy()
        const patchResp = await borrowerPage.request.patch(`/api/users/${borrowerId}`, {
          data: { verificationFlags: ['EMAIL'] },
        })
        expect(patchResp.ok(), 'PATCH /api/users/:id to set verificationFlags').toBeTruthy()
      }

      await borrowerPage.goto('/libraries')
      const borrowerLibraryCard = borrowerPage
        .locator('.card', { hasText: LIBRARY_NAME })
        .first()
      await expect(borrowerLibraryCard).toBeVisible()
      await borrowerLibraryCard.getByRole('button', { name: /Join Library/i }).click()
      await expect(borrowerLibraryCard.getByText(/Joined/i)).toBeVisible()

      // -----------------------------------------------------------------
      // 6. Borrower searches for the item and starts borrowing; lender approves
      // -----------------------------------------------------------------
      // 6a. Borrower searches and opens the item
      await borrowerPage.goto('/browse')
      await borrowerPage.locator('input[placeholder*="Search"]').fill(ITEM_NAME)
      await borrowerPage.getByRole('button', { name: /^Search$/ }).click()
      const borrowerBrowseLink = borrowerPage.locator('a', { hasText: ITEM_NAME }).first()
      await expect(borrowerBrowseLink).toBeVisible()
      await borrowerBrowseLink.click()
      await borrowerPage.waitForURL(/\/items\/[^/]+/)
      const itemUrl = borrowerPage.url()

      // 6b. Borrower starts borrowing item
      await borrowerPage.getByRole('button', { name: /Request to Borrow/i }).click()
      await borrowerPage
        .getByRole('button', { name: /Yes, Request Item/i })
        .click()
      // Status badge should change to "Pending Approval"
      await expect(borrowerPage.getByText(/Pending Approval/i)).toBeVisible()

      // 6c. Lender approves the loan (mark as borrowed)
      await lenderPage.goto(itemUrl)
      await expect(lenderPage.getByText(/Pending Approval/i)).toBeVisible()
      await lenderPage
        .getByRole('button', { name: /^Mark as Borrowed$/i })
        .first()
        .click()
      await lenderPage
        .getByRole('button', { name: /Yes, Mark Borrowed/i })
        .click()
      // After approval, the item status should be "Checked Out"
      await expect(lenderPage.getByText(/Checked Out/i)).toBeVisible()

      // -----------------------------------------------------------------
      // 7. Borrower starts return; lender finalizes; borrower sees AVAILABLE
      // -----------------------------------------------------------------
      // 7a. Borrower starts the return through the UI ("Start Return" button)
      await borrowerPage.goto(itemUrl)
      await expect(borrowerPage.getByText(/You.*are currently borrowing/i)).toBeVisible()
      await borrowerPage.getByRole('button', { name: /^Start Return$/i }).click()
      await borrowerPage
        .getByRole('button', { name: /Yes, Start Return/i })
        .click()
      // After starting the return, borrower should see the waiting confirmation message
      await expect(
        borrowerPage.getByText(/Return started\. Waiting for the lender to confirm/i),
      ).toBeVisible()

      // 7b. Lender confirms the return (marks item available again)
      await lenderPage.goto(itemUrl)
      await lenderPage.getByRole('button', { name: /Mark as Returned/i }).click()
      await lenderPage
        .getByRole('button', { name: /Yes, Mark Available/i })
        .click()
      await expect(lenderPage.getByText(/Available/i).first()).toBeVisible()

      // 7c/7d. Borrower searches for the item and sees it as Available again
      await borrowerPage.goto('/browse')
      await borrowerPage.locator('input[placeholder*="Search"]').fill(ITEM_NAME)
      await borrowerPage.getByRole('button', { name: /^Search$/ }).click()
      const returnedCard = borrowerPage.locator('a', { hasText: ITEM_NAME }).first()
      await expect(returnedCard).toBeVisible()
      await expect(returnedCard.getByText(/Available/i)).toBeVisible()
    } finally {
      // Use allSettled so a context that was already torn down (e.g. due to
      // a browser crash mid-test) doesn't mask the original test failure
      // with a "Target page, context or browser has been closed" error here.
      await Promise.allSettled([
        adminCtx.close(),
        lenderCtx.close(),
        borrowerCtx.close(),
      ])
    }
  })
})
