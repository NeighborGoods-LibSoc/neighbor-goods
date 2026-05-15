'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { User } from '@/payload-types'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  actionURL?: string | null
  item?: { id: string; name?: string } | string | null
  triggeredBy?: { id: string; name?: string } | string | null
  createdAt: string
}

interface NotificationsClientProps {
  user: User
}

const typeLabels: Record<string, string> = {
  borrow_request: '📬 Borrow Request',
  borrow_approved: '✅ Approved',
  borrow_rejected: '❌ Declined',
  item_returned: '🔄 Returned',
  item_damaged: '⚠️ Damaged',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function NotificationsClient({ user }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notifications?where[recipient][equals]=${user.id}&sort=-createdAt&limit=50&depth=1`,
      )
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.docs || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read)
    try {
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          }),
        ),
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <main className="container" style={{ paddingTop: '2rem' }}>
        <p>Loading notifications...</p>
      </main>
    )
  }

  return (
    <main className="container" style={{ paddingTop: '2rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: 'var(--foreground)',
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted-foreground)' }}>
          <p style={{ fontSize: '1.2rem' }}>No notifications yet</p>
          <p>When someone requests to borrow your items, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: notification.read ? 'var(--background)' : 'var(--muted)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                transition: 'background-color 0.2s',
              }}
            >
              {!notification.read && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    flexShrink: 0,
                    marginTop: '0.5rem',
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {typeLabels[notification.type] || notification.type}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', flexShrink: 0 }}>
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.95rem' }}>{notification.message}</p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {notification.actionURL && (
                    <Link
                      href={notification.actionURL}
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--primary)',
                        textDecoration: 'none',
                      }}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id)
                      }}
                    >
                      View Item →
                    </Link>
                  )}
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: 'var(--muted-foreground)',
                        padding: 0,
                      }}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
