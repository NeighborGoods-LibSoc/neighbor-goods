'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@/payload-types'

export const AuthNav: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname])

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(
          `/api/notifications?where[recipient][equals]=${user.id}&where[read][equals]=false&limit=0`,
        )
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.totalDocs || 0)
        }
      } catch {
        // silently fail
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user, pathname])

  if (isLoading) {
    return null
  }

  if (user) {
    return (
      <nav className="flex gap-4 items-center">
        <Link
          href="/dashboard"
          className="text-primary hover:text-var(--light-green) transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/inventory"
          className="text-primary hover:text-var(--light-green) transition-colors"
        >
          Inventory
        </Link>
        <Link
          href="/libraries"
          className="text-primary hover:text-var(--light-green) transition-colors"
        >
          Libraries
        </Link>
        <Link
          href="/profile"
          className="text-primary hover:text-var(--light-green) transition-colors"
        >
          My Profile
        </Link>
        <Link
          href="/my-items"
          className="text-primary hover:text-var(--light-green) transition-colors"
        >
          My Items
        </Link>
        <Link
          href="/notifications"
          className="text-primary hover:text-var(--light-green) transition-colors"
          style={{ position: 'relative' }}
        >
          Notifications
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-10px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <button
          onClick={async () => {
            await fetch('/api/users/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="text-white primary:text-var(--light-green) transition-colors bg-transparent border-none cursor-pointer"
        >
          Logout
        </button>
      </nav>
    )
  }

  return (
    <nav className="flex gap-4 items-center">
      <Link href="/login" className="text-primary hover:text-var(--light-green) transition-colors">
        Log In
      </Link>
      <Link href="/signup" className="text-primary hover:text-var(--light-green) transition-colors">
        Sign Up
      </Link>
    </nav>
  )
}
