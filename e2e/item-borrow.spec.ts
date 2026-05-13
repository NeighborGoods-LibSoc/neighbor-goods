import { test, expect, request } from '@playwright/test'

const BASE_URL = 'http://localhost:3100'

const OWNER_USER = {
  name: 'Item Owner',
  email: 'owner@example.com',
  password: 'password123',
}

const BORROWER_USER = {
  name: 'Test Borrower',
  email: 'borrower@example.com',
  password: 'password123',
}

let seededItemId: string | null = null

test.describe('Item Borrowing Flow', () => {
  test.beforeAll(async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL })

    // Create owner and borrower users (ignore errors if already exist)
    await ctx.post('/api/users', { data: OWNER_USER })
    await ctx.post('/api/users', { data: BORROWER_USER })

    // Log in as borrower and patch verificationFlags
    const borrowerLoginRes = await ctx.post('/api/users/login', {
      data: { email: BORROWER_USER.email, password: BORROWER_USER.password },
    })
    const borrowerData = await borrowerLoginRes.json()
    if (borrowerData?.user?.id && borrowerData?.token) {
      await ctx.patch(`/api/users/${borrowerData.user.id}`, {
        headers: { Authorization: `JWT ${borrowerData.token}`, 'Content-Type': 'application/json' },
        data: { verificationFlags: ['EMAIL'] },
      })
    }

    // Log in as owner to get auth token
    const loginRes = await ctx.post('/api/users/login', {
      data: { email: OWNER_USER.email, password: OWNER_USER.password },
    })
    const loginData = await loginRes.json()
    const ownerId = loginData?.user?.id
    const token = loginData?.token

    if (ownerId && token) {
      // Upload a minimal 1x1 PNG as the item image
      const pngBytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      )
      const mediaRes = await ctx.post('/api/media', {
        headers: { Authorization: `JWT ${token}` },
        multipart: {
          file: { name: 'test.png', mimeType: 'image/png', buffer: pngBytes },
        },
      })
      const mediaData = await mediaRes.json()
      const mediaId = mediaData?.doc?.id

      if (mediaId) {
        // Create a READY item owned by the owner
        const itemRes = await ctx.post('/api/items', {
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          data: {
            name: 'E2E Test Drill',
            description: 'A drill for e2e testing',
            borrowerVerification: ['EMAIL'],
            borrowingTime: 7,
            primaryImage: mediaId,
            offeredBy: ownerId,
            status: 'READY',
          },
        })
        const itemData = await itemRes.json()
        seededItemId = itemData?.doc?.id ?? null
      }
    }

    await ctx.dispose()
  })

  test('logged-in user can request to borrow an available item', async ({ page }) => {
    test.skip(!seededItemId, 'No seeded item available')

    // Log in as borrower
    await page.goto('/login')
    await page.getByLabel('Email Address').fill(BORROWER_USER.email)
    await page.getByLabel('Password').fill(BORROWER_USER.password)
    await page.getByRole('button', { name: 'Log In' }).click()

    // Wait for redirect after login
    await page.waitForURL('/dashboard')

    // Navigate directly to the seeded item
    await page.goto(`/items/${seededItemId}`)

    // Request to borrow
    const borrowButton = page.getByRole('button', { name: /Request to Borrow/i })
    await expect(borrowButton).toBeVisible()
    await borrowButton.click()

    // Confirm in dialog
    await page.getByRole('button', { name: /Yes, Request Item/i }).click()

    // Verify the request was acknowledged (status changes to pending approval)
    await expect(page.getByText(/pending approval/i)).toBeVisible()
  })

  test('visitor sees item details without borrow option', async ({ page }) => {
    test.skip(!seededItemId, 'No seeded item available')

    // Navigate directly to item detail page without logging in
    await page.goto(`/items/${seededItemId}`)

    // Item details should be visible
    await expect(page.getByRole('heading').first()).toBeVisible()

    // Borrow button should not be visible for unauthenticated users
    await expect(page.getByRole('button', { name: /Request to Borrow/i })).not.toBeVisible()
  })
})
