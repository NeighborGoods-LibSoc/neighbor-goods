'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const messageParam = searchParams.get('message')
    if (messageParam) {
      setMessage(messageParam)
    }
  }, [searchParams])

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            router.push('/dashboard')
          }
        }
      } catch (error) {
        // Not logged in, stay on login page
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        // Redirect to dashboard on successful login
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.errors?.[0]?.message || 'Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <main className="container">
      <div className="form-container">
        <h2>Log In</h2>
        <p>Welcome back! Please log in to your account.</p>

        {message && (
          <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="signup-link">
          <p>
            Don't have an account? <Link href="/signup">Sign up</Link>
          </p>
        </div>
        <div className="forgot-password">
          <p>
            Forgot password? <Link href="/forgot-password">Forgot password</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
