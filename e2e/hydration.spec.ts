import { test, expect } from '@playwright/test'

// Issue #92 - Test for React hydration errors on pages that use
// locale-dependent formatting (e.g. toLocaleDateString) in server components.

test.describe('Hydration - no console hydration errors', () => {
  test('item detail page renders without React hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Hydration')) {
        hydrationErrors.push(msg.text())
      }
    })

    // Navigate to items listing and open the first item
    await page.goto('/items')
    const firstItem = page.getByRole('link').first()
    await expect(firstItem).toBeVisible()
    await firstItem.click()

    // Wait for the page to settle
    await page.waitForLoadState('networkidle')

    expect(hydrationErrors).toHaveLength(0)
  })
})
