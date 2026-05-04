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

    // Navigate to items listing
    await page.goto('/items')

    // Click the first available item
    await page.getByRole('link').filter({ hasText: /borrow/i }).first().click()

    // Request to borrow
    const borrowButton = page.getByRole('button', { name: /Request to Borrow/i })
    await expect(borrowButton).toBeVisible()
    await borrowButton.click()

    // Verify the request was acknowledged
    await expect(page.getByText(/request/i)).toBeVisible()
  })

  test('visitor sees item details without borrow option', async ({ page }) => {
    // Navigate directly to items listing without logging in
    await page.goto('/items')

    // Click the first item link
    await page.getByRole('link').first().click()

    // Item details should be visible
    await expect(page.getByRole('heading')).toBeVisible()

    // Borrow button should not be visible for unauthenticated users
    await expect(page.getByRole('button', { name: /Request to Borrow/i })).not.toBeVisible()
  })
})
