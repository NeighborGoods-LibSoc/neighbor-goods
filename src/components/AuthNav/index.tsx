'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/payload-types'

export const AuthNav: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return null
  }

  if (user) {
    return (
      <nav className="flex gap-4 items-center">
        <Link
          href="/dashboard"
          className="text-white hover:text-var(--light-green) transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/inventory"
          className="text-white hover:text-var(--light-green) transition-colors"
        >
          Inventory
        </Link>
        <Link
          href="/profile"
          className="text-white hover:text-var(--light-green) transition-colors"
        >
          My Profile
        </Link>
        <Link
          href="/items/transfers"
          className="text-white hover:text-var(--light-green) transition-colors"
        >
          Transfers
        </Link>
        <button
          onClick={async () => {
            await fetch('/api/users/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="text-white hover:text-var(--light-green) transition-colors bg-transparent border-none cursor-pointer"
        >
          Logout
        </button>
      </nav>
    )
  }

  return (
    <nav className="flex gap-4 items-center">
      <Link href="/login" className="text-white hover:text-var(--light-green) transition-colors">
        Log In
      </Link>
      <Link href="/signup" className="text-white hover:text-var(--light-green) transition-colors">
        Sign Up
      </Link>
    </nav>
  )
}
