import { test, expect } from '@playwright/test'

test.describe('Item Borrowing Flow', () => {
  test('logged-in user can request to borrow an available item', async ({ page }) => {
    // Log in
    await page.goto('/login')
    await page.getByLabel('Email').fill('neighbor@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    // Wait for redirect after login
    await page.waitForURL('/')

    // Navigate to the items browse listing
    await page.goto('/browse')

    // Click the first item card (cards link to an item detail page)
    await page.locator('a[href^="/items/"]').first().click()

    // Request to borrow
    const borrowButton = page.getByRole('button', { name: /Request to Borrow/i })
    await expect(borrowButton).toBeVisible()
    await borrowButton.click()

    // Verify the request was acknowledged
    await expect(page.getByText(/request/i)).toBeVisible()
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
