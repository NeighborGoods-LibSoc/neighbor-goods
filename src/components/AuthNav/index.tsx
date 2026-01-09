'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@/payload-types'

export const AuthNav: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

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
