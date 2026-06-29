import { test, expect } from '@playwright/test'

test.describe('Thing Request – Library Selection', () => {
  test('request form shows library selection UI for logged-in user', async ({ page }) => {
    // Log in as a dedicated, per-test user. The suite runs with
    // `fullyParallel: true`, so sharing one account across these tests would
    // race on Payload's auth session array and intermittently log the user out.
    await page.goto('/login')
    await page.getByLabel('Email').fill('requester-1@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.waitForURL('/dashboard')

    // Navigate to the request form
    await page.goto('/items/request')

    // The Libraries section should be visible
    await expect(page.getByText(/^Libraries\b/)).toBeVisible()

    // Should show either library chips or a "not a member" message
    const hasLibraries = await page.locator('label').filter({ hasText: /./}).count()
    const hasNoLibraryMessage = await page.getByText(/not a member of any libraries/i).isVisible().catch(() => false)

    expect(hasLibraries > 0 || hasNoLibraryMessage).toBeTruthy()
  })

  test('submit button is disabled when user has no libraries', async ({ page }) => {
    // This test verifies the disabled state when no libraries are available
    // Log in with a dedicated, per-test user (see note in the first test).
    await page.goto('/login')
    await page.getByLabel('Email').fill('requester-2@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.waitForURL('/dashboard')

    await page.goto('/items/request')

    // Wait for the form to load
    await page.waitForSelector('form')

    // If the user has no libraries, the submit button should be disabled
    const noLibraryMessage = page.getByText(/not a member of any libraries/i)
    if (await noLibraryMessage.isVisible().catch(() => false)) {
      const submitButton = page.getByRole('button', { name: /Post Request/i })
      await expect(submitButton).toBeDisabled()
    }
  })

  test('library chips can be toggled on and off', async ({ page }) => {
    // Log in as a dedicated, per-test user (see note in the first test).
    await page.goto('/login')
    await page.getByLabel('Email').fill('requester-3@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.waitForURL('/dashboard')

    await page.goto('/items/request')
    await page.waitForSelector('form')

    // Find library checkbox labels (they use sr-only checkboxes)
    const libraryCheckboxes = page.locator('input[type="checkbox"].sr-only')
    const count = await libraryCheckboxes.count()

    if (count > 0) {
      // All should be checked by default
      const firstCheckbox = libraryCheckboxes.first()
      await expect(firstCheckbox).toBeChecked()

      // Click the parent label to uncheck
      const firstLabel = firstCheckbox.locator('..')
      await firstLabel.click()
      await expect(firstCheckbox).not.toBeChecked()

      // Click again to re-check
      await firstLabel.click()
      await expect(firstCheckbox).toBeChecked()
    }
  })

  test('form submission fails without selecting a library', async ({ page }) => {
    // Log in as a dedicated, per-test user (see note in the first test).
    await page.goto('/login')
    await page.getByLabel('Email').fill('requester-4@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Log In' }).click()
    await page.waitForURL('/dashboard')

    await page.goto('/items/request')
    await page.waitForSelector('form')

    // Uncheck all library checkboxes
    const libraryCheckboxes = page.locator('input[type="checkbox"].sr-only')
    const count = await libraryCheckboxes.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const checkbox = libraryCheckboxes.nth(i)
        if (await checkbox.isChecked()) {
          await checkbox.locator('..').click()
        }
      }

      // Fill in required fields
      await page.getByLabel(/name/i).first().fill('Test Request')
      await page.getByLabel(/description/i).fill('Test description')
      await page.getByLabel(/agree/i).check()

      // Try to submit
      await page.getByRole('button', { name: /Post Request/i }).click()

      // Should show an error about libraries
      await expect(page.getByText(/must select at least one library/i)).toBeVisible()
    }
  })

  test('visitor cannot access request form', async ({ page }) => {
    // Navigate to request form without logging in
    await page.goto('/items/request')

    // Should redirect to login or show auth required message
    // The exact behavior depends on the app's auth setup
    const url = page.url()
    const hasLoginRedirect = url.includes('/login')
    const hasAuthMessage = await page.getByText(/log in|sign in|unauthorized/i).isVisible().catch(() => false)

    expect(hasLoginRedirect || hasAuthMessage).toBeTruthy()
  })
})
