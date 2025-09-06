'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState({
    email: '',
  })
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email
        }),
      })

      if (res.ok) {
        setStatus('sent')
        router.push('/login?message=Email successfully sent to reset password!')
      } else {
        setStatus('error')
        const data = await res.json()
        setError(data.errors?.[0]?.message || 'Failed to send password reset email!')
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
        <h2>Reset your password</h2>
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

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Sending email...' : 'Send reset link'}
          </button>
          {status === 'sent' && (
            <p>Reset link sent if email exists.</p>
          )}
          {status === 'error' && (
            <p>Something went wrong. Try again later.</p>
          )}
        </form>
      </div>
    </main>
  )
}
