import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { DashboardAvatar, getAvatarInitials } from './page.client'

const testUser = {
  id: 'user-123',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  createdAt: '2026-01-02T00:00:00.000Z',
}

describe('Dashboard avatar placeholder', () => {
  it('builds stable initials from a name, email, or empty profile', () => {
    expect(getAvatarInitials('Ada Lovelace', 'ada@example.com')).toBe('AL')
    expect(getAvatarInitials('Ada King Lovelace', 'ada@example.com')).toBe('AL')
    expect(getAvatarInitials('', 'neighbor@example.com')).toBe('NE')
    expect(getAvatarInitials(null, null)).toBe('NG')
  })

  it('renders an accessible initials avatar instead of a missing placeholder image', () => {
    const markup = renderToStaticMarkup(<DashboardAvatar user={testUser as any} />)

    expect(markup).toContain('role="img"')
    expect(markup).toContain('aria-label="Ada Lovelace avatar placeholder"')
    expect(markup).toContain('>AL</div>')
    expect(markup).not.toContain('<img')
    expect(markup).not.toContain('/api/placeholder/120/120')
  })
})
