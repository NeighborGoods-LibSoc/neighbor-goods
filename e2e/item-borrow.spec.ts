import { test, expect } from '@playwright/test'

test.describe('Item Borrowing Flow', () => {
  test('logged-in user can request to borrow an available item', async ({ page, request }) => {
    // Create a dedicated READY item for this test (owned by a different user,
    // so the logged-in neighbor is allowed to request it). Using a fresh item
    // keeps parallel browser projects from contending over the same fixture.
    const seedResponse = await request.post('/api/test-seed?fresh=1')
    expect(seedResponse.ok()).toBeTruthy()
    const { itemId } = await seedResponse.json()
    expect(itemId).toBeTruthy()

    // Log in as a dedicated borrower (not the shared neighbor@example.com that
    // other specs use in parallel) so this login never races with another
    // test's concurrent login for the same user.
    await page.goto('/login')
    await page.getByLabel('Email').fill('borrower@example.com')
    await page.getByLabel('Password').fill('password123')

    // Wait for the login request to complete so the auth cookie is committed
    // before we navigate away (avoids a logged-out item page under load).
    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/users/login') && res.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Log In' }).click(),
    ])
    expect(loginResponse.ok()).toBeTruthy()

    // Wait for redirect to the dashboard after a successful login
    await page.waitForURL('**/dashboard')

    // Make sure the auth cookie is actually present before navigating, so the
    // item page renders for an authenticated user (and shows the borrow button).
    await expect
      .poll(async () => (await page.context().cookies()).some((c) => c.name === 'payload-token'))
      .toBeTruthy()

    // Open the dedicated item's detail page. The borrow button only renders for
    // an authenticated, non-owner user; under heavy load the dev server can
    // occasionally render a stale logged-out page, so retry the navigation until
    // the authenticated view (with the borrow button) is shown.
    const borrowButton = page.getByRole('button', { name: 'Request to Borrow' })
    await expect(async () => {
      await page.goto(`/items/${itemId}`)
      await expect(borrowButton).toBeVisible({ timeout: 5000 })
    }).toPass({ timeout: 30000 })

    // Request to borrow (opens a confirmation dialog)
    await borrowButton.click()

    // Confirm the request in the dialog
    await page.getByRole('button', { name: 'Yes, Request Item' }).click()

    // Verify the request was acknowledged: the item is now pending approval
    await expect(page.getByText('Pending Approval')).toBeVisible()
  })

  test('visitor sees item details without borrow option', async ({ page, request }) => {
    // The browse listing requires authentication, but individual item detail
    // pages are publicly viewable. Look up an existing item via the public
    // browse API, then visit its detail page directly as an unauthenticated visitor.
    const response = await request.get('/api/browse?limit=1')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    const firstItem = data.items?.[0]
    test.skip(!firstItem, 'No items available to view')

    await page.goto(`/items/${firstItem.id}`)

    // Item details should be visible (the item name is rendered as the page's h1)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Borrow button should not be visible for unauthenticated users
    await expect(page.getByRole('button', { name: /Request to Borrow/i })).not.toBeVisible()
  })
})
