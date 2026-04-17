/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { CreateLibraryClient } from './page.client'

// Mock next/navigation
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock fetch globally
const fetchMock = vi.fn()

const testUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' }

describe('CreateLibraryClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    pushMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the form with all expected fields', () => {
    render(<CreateLibraryClient user={testUser} />)

    expect(screen.getByText('Start a New Library')).toBeInTheDocument()
    expect(screen.getByLabelText(/Library Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Public URL/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Default Loan Time/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Street Address/)).toBeInTheDocument()
    expect(screen.getByLabelText(/City/)).toBeInTheDocument()
    expect(screen.getByLabelText(/State/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Zip/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Country/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Service Radius/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Library/i })).toBeInTheDocument()
  })

  it('has correct default values for loan time and radius', () => {
    render(<CreateLibraryClient user={testUser} />)

    expect(screen.getByLabelText(/Default Loan Time/)).toHaveValue(14)
    expect(screen.getByLabelText(/Service Radius/)).toHaveValue(10)
  })

  it('shows validation error when name is empty', async () => {
    render(<CreateLibraryClient user={testUser} />)

    // Use fireEvent.submit to bypass HTML5 required validation
    fireEvent.submit(screen.getByRole('button', { name: /Create Library/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Library name is required')).toBeInTheDocument()
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows validation error when loan time is less than 1', async () => {
    const user = userEvent.setup()
    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'My Library')

    const loanInput = screen.getByLabelText(/Default Loan Time/)
    await user.clear(loanInput)
    await user.type(loanInput, '0')

    // Use fireEvent.submit to bypass HTML5 min validation
    fireEvent.submit(screen.getByRole('button', { name: /Create Library/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Default loan time must be at least 1 day')).toBeInTheDocument()
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows validation error when radius is 0 or negative', async () => {
    const user = userEvent.setup()
    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'My Library')

    const radiusInput = screen.getByLabelText(/Service Radius/)
    await user.clear(radiusInput)
    await user.type(radiusInput, '0')

    // Use fireEvent.submit to bypass HTML5 min validation
    fireEvent.submit(screen.getByRole('button', { name: /Create Library/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Service area radius must be greater than 0')).toBeInTheDocument()
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('submits the form successfully and shows success modal', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ doc: { id: 'lib-1', name: 'Elm Street Tool Library' } }),
    })

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Elm Street Tool Library')
    await user.type(screen.getByLabelText(/City/), 'Springfield')
    await user.type(screen.getByLabelText(/State/), 'IL')

    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(screen.getByText('Library Created!')).toBeInTheDocument()
    })

    expect(screen.getByText(/Your library has been created/)).toBeInTheDocument()
    expect(screen.getByText(/"Elm Street Tool Library" is ready for neighbors to join./)).toBeInTheDocument()

    // Verify fetch was called with correct data
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/distributedLibraries')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.name).toBe('Elm Street Tool Library')
    expect(body.administrators).toEqual(['user-123'])
    expect(body.members).toEqual(['user-123'])
    expect(body.default_loan_time_days).toBe(14)
    expect(body.area.center_point.city).toBe('Springfield')
    expect(body.area.center_point.state).toBe('IL')
    expect(body.area.radius_kilometers).toBe(10)
  })

  it('navigates to dashboard when clicking "Go to Dashboard" after success', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ doc: { id: 'lib-1' } }),
    })

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Test Library')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(screen.getByText('Library Created!')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Go to Dashboard/i }))
    expect(pushMock).toHaveBeenCalledWith('/dashboard')
  })

  it('resets the form when clicking "Create Another" after success', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ doc: { id: 'lib-1' } }),
    })

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Test Library')
    await user.type(screen.getByLabelText(/City/), 'Portland')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(screen.getByText('Library Created!')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Create Another/i }))

    // Form fields should be reset
    expect(screen.getByLabelText(/Library Name/)).toHaveValue('')
    expect(screen.getByLabelText(/City/)).toHaveValue('')
    expect(screen.getByLabelText(/Default Loan Time/)).toHaveValue(14)
    expect(screen.getByLabelText(/Service Radius/)).toHaveValue(10)
  })

  it('shows error modal when the API returns an error', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: [{ message: 'Duplicate library name' }] }),
    })

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Existing Library')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Duplicate library name')).toBeInTheDocument()
  })

  it('shows generic error when API returns non-JSON error', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => { throw new Error('not json') },
    })

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Test Library')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to create library')).toBeInTheDocument()
    })
  })

  it('shows error modal when fetch throws a network error', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Test Library')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('closes error modal with "Try Again" button', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValueOnce(new Error('Server down'))

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Test Library')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Try Again/i }))

    // The error dialog should close — the heading should disappear
    await waitFor(() => {
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()

    // Create a promise we control to keep the submit in-flight
    let resolveSubmit!: (value: any) => void
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSubmit = resolve
      }),
    )

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'Test Library')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    // While submitting, button text changes and it's disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creating Library.../i })).toBeDisabled()
    })

    // Resolve the fetch
    resolveSubmit({ ok: true, json: async () => ({}) })

    await waitFor(() => {
      expect(screen.getByText('Library Created!')).toBeInTheDocument()
    })
  })

  it('does not send public_url when left empty', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ doc: { id: 'lib-1' } }),
    })

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'No URL Library')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.public_url).toBeUndefined()
  })

  it('sends public_url when provided', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ doc: { id: 'lib-1' } }),
    })

    render(<CreateLibraryClient user={testUser} />)

    await user.type(screen.getByLabelText(/Library Name/), 'URL Library')
    await user.type(screen.getByLabelText(/Public URL/), 'https://my-library.example.com')
    await user.click(screen.getByRole('button', { name: /Create Library/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.public_url).toBe('https://my-library.example.com')
  })
})
