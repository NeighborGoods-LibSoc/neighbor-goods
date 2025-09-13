'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null) // null = checking, true = valid, false = invalid

  // Verify token when page loads
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }

    const verifyToken = async () => {
      try {
        // Use a minimal test request to check if token is valid
        // We'll send a request with an intentionally short password to trigger validation
        // but the token validation happens first
        const res = await fetch('/api/users/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password: '1', // Intentionally short to trigger password validation
            passwordConfirm: '1'
          }),
        })

        const data = await res.json()

        if (res.status === 400 && data.errors) {
          // Check if any error is specifically about the token
          const hasTokenError = data.errors.some((err: any) => {
            const message = err.message?.toLowerCase() || ''
            const field = err.field?.toLowerCase() || ''

            // Token errors usually mention token, expired, invalid, or have field 'token'
            return field === 'token' ||
              message.includes('token') ||
              message.includes('expired') ||
              message.includes('invalid token') ||
              message.includes('reset token')
          })

          // Check if error is specifically about password validation
          const hasPasswordError = data.errors.some((err: any) => {
            const field = err.field?.toLowerCase() || ''
            const message = err.message?.toLowerCase() || ''

            return field === 'password' ||
              field === 'passwordconfirm' ||
              message.includes('password')
          })

          if (hasTokenError) {
            console.log('Token error detected:', data.errors)
            setTokenValid(false)
            setError('This password reset link is invalid or has expired.')
          } else if (hasPasswordError) {
            console.log('Password validation error (token is valid):', data.errors)
            setTokenValid(true)
          } else {
            // Unknown error type, log it and assume token issue for safety
            console.log('Unknown error type:', data.errors)
            setTokenValid(false)
            setError('This password reset link is invalid or has expired.')
          }
        } else if (res.ok) {
          // Shouldn't happen with a 1-character password, but token would be valid
          setTokenValid(true)
        } else {
          // Other error status, assume token issue
          console.log('Non-400 error status:', res.status, data)
          setTokenValid(false)
          setError('This password reset link is invalid or has expired.')
        }
      } catch (err) {
        console.error('Token verification error:', err)
        setTokenValid(false)
        setError('Unable to verify reset link. Please try again.')
      }
    }

    verifyToken()
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (!token) {
      setError('Invalid reset token.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/login?message=Password reset successful! Please log in.')
      } else {
        console.error('Reset password error:', data)
        setError(data.errors?.[0]?.message || data.message || 'Failed to reset password.')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show error if no token or token is invalid
  if (!token || tokenValid === false) {
    return (
      <main className="container">
        <div className="form-container">
          <h2>Invalid Reset Link</h2>
          <p>{error || 'This password reset link is invalid or has expired.'}</p>
          <a href="/forgot-password" style={{ color: '#007cba', textDecoration: 'underline' }}>
            Request a new password reset link
          </a>
        </div>
      </main>
    )
  }

  // Show loading state while verifying token
  if (tokenValid === null) {
    return (
      <main className="container">
        <div className="form-container">
          <h2>Verifying Reset Link...</h2>
          <p>Please wait while we verify your password reset link.</p>
        </div>
      </main>
    )
  }

  // Show the form only if token is valid
  return (
    <main className="container">
      <div className="form-container">
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirm New Password</label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              className="form-input"
              minLength={6}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </main>
  )
}
