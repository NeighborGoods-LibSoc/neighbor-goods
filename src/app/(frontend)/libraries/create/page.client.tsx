'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateLibraryClientProps {
  user: any
}

export const CreateLibraryClient: React.FC<CreateLibraryClientProps> = ({ user }) => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    publicUrl: '',
    defaultLoanTimeDays: '14',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    radiusKilometers: '10',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalState, setModalState] = useState<{
    open: boolean
    type: 'success' | 'error'
    message: string
    libraryName?: string
  }>({ open: false, type: 'success', message: '' })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      publicUrl: '',
      defaultLoanTimeDays: '14',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      radiusKilometers: '10',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.name.trim()) {
        throw new Error('Library name is required')
      }

      const loanDays = Number(formData.defaultLoanTimeDays)
      if (!loanDays || loanDays < 1) {
        throw new Error('Default loan time must be at least 1 day')
      }

      const radiusKm = Number(formData.radiusKilometers)
      if (!radiusKm || radiusKm <= 0) {
        throw new Error('Service area radius must be greater than 0')
      }

      const libraryData: Record<string, any> = {
        name: formData.name,
        administrators: [user.id],
        members: [user.id],
        default_loan_time_days: loanDays,
        area: {
          center_point: {
            street_address: formData.streetAddress || undefined,
            city: formData.city || undefined,
            state: formData.state || undefined,
            zip_code: formData.zipCode || undefined,
            country: formData.country || undefined,
          },
          radius_kilometers: radiusKm,
        },
      }

      if (formData.publicUrl.trim()) {
        libraryData.public_url = formData.publicUrl
      }

      const response = await fetch('/api/distributedLibraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(libraryData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.errors?.[0]?.message || errorData?.message || 'Failed to create library',
        )
      }

      setModalState({
        open: true,
        type: 'success',
        message: 'Your library has been created! You are now its administrator.',
        libraryName: formData.name,
      })
    } catch (error) {
      setModalState({
        open: true,
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create library',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Dialog
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className={modalState.type === 'success' ? 'text-green-700' : 'text-red-700'}
            >
              {modalState.type === 'success' ? 'Library Created!' : 'Error'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {modalState.type === 'success' ? (
                <>
                  <span className="block text-base">{modalState.message}</span>
                  {modalState.libraryName && (
                    <span className="mt-2 block font-medium text-foreground">
                      &quot;{modalState.libraryName}&quot; is ready for neighbors to join.
                    </span>
                  )}
                </>
              ) : (
                <span className="text-red-600">{modalState.message}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            {modalState.type === 'success' ? (
              <>
                <Button variant="outline" onClick={() => { setModalState((prev) => ({ ...prev, open: false })); resetForm() }}>
                  Create Another
                </Button>
                <Button onClick={() => router.push('/dashboard')}>Go to User Dashboard</Button>
              </>
            ) : (
              <Button onClick={() => setModalState((prev) => ({ ...prev, open: false }))}>
                Try Again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <h1 className="mb-2 text-3xl font-bold">Start a New Library</h1>
        <p className="mb-6 text-muted-foreground">
          Create a shared lending library for your neighborhood. You&apos;ll be the first
          administrator, and neighbors can join to share and borrow items together.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Library Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Library Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder='e.g. "Elm Street Tool Library"'
              required
            />
          </div>

          {/* Public URL */}
          <div className="space-y-2">
            <Label htmlFor="publicUrl">Public URL</Label>
            <Input
              id="publicUrl"
              name="publicUrl"
              type="url"
              value={formData.publicUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/my-library"
            />
            <p className="text-sm text-muted-foreground">
              Optional website or social media page for your library.
            </p>
          </div>

          {/* Default Loan Time */}
          <div className="space-y-2">
            <Label htmlFor="defaultLoanTimeDays">
              Default Loan Time (days) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="defaultLoanTimeDays"
              name="defaultLoanTimeDays"
              type="number"
              min="1"
              value={formData.defaultLoanTimeDays}
              onChange={handleInputChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              How long members can borrow items by default.
            </p>
          </div>

          {/* Service Area */}
          <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Service Area</legend>
            <p className="text-sm text-muted-foreground">
              The location can be the area where you store goods, or just the center of your neighborhood if you&apos;re creating a distributed library.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  type="text"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Springfield"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="IL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip / Postal Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="62701"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="US"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiusKilometers">
                Service Radius (km) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="radiusKilometers"
                name="radiusKilometers"
                type="number"
                min="1"
                step="0.5"
                value={formData.radiusKilometers}
                onChange={handleInputChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                How far from the center point your library serves.
              </p>
            </div>
          </fieldset>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating Library...' : 'Create Library'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
