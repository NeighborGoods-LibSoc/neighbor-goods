'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DistributedLibrary, User } from '@/payload-types'
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

interface EditLibraryClientProps {
  library: DistributedLibrary & { accepts_new_members?: boolean }
  user: User
  token: string
}

export const EditLibraryClient: React.FC<EditLibraryClientProps> = ({ library, token }) => {
  const router = useRouter()

  const initialCenter = (library as any)?.area?.center_point || {}
  const initialRadius = (library as any)?.area?.radius_kilometers

  const [formData, setFormData] = useState({
    name: library.name || '',
    publicUrl: (library as any).public_url || '',
    defaultLoanTimeDays: String((library as any).default_loan_time_days ?? 14),
    streetAddress: initialCenter.street_address || '',
    city: initialCenter.city || '',
    state: initialCenter.state || '',
    zipCode: initialCenter.zip_code || '',
    country: initialCenter.country || '',
    radiusKilometers: String(initialRadius ?? 10),
    acceptsNewMembers:
      library.accepts_new_members === undefined || library.accepts_new_members === null
        ? true
        : Boolean(library.accepts_new_members),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalState, setModalState] = useState<{
    open: boolean
    type: 'success' | 'error'
    message: string
  }>({ open: false, type: 'success', message: '' })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const showError = (message: string) => {
      setModalState({ open: true, type: 'error', message })
      setIsSubmitting(false)
    }

    if (!formData.name.trim()) {
      showError('Library name is required')
      return
    }

    const loanDays = Number(formData.defaultLoanTimeDays)
    if (!loanDays || loanDays < 1) {
      showError('Default loan time must be at least 1 day')
      return
    }

    const radiusKm = Number(formData.radiusKilometers)
    if (!radiusKm || radiusKm <= 0) {
      showError('Service area radius must be greater than 0')
      return
    }

    try {
      const updateData: Record<string, any> = {
        name: formData.name,
        default_loan_time_days: loanDays,
        accepts_new_members: formData.acceptsNewMembers,
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
        updateData.public_url = formData.publicUrl
      } else {
        updateData.public_url = null
      }

      const response = await fetch(`/api/distributedLibraries/${library.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        showError(
          errorData?.errors?.[0]?.message ||
            errorData?.message ||
            'Failed to update library',
        )
        return
      }

      setModalState({
        open: true,
        type: 'success',
        message: 'Library settings updated.',
      })
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update library')
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
              {modalState.type === 'success' ? 'Settings Saved' : 'Error'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              <span className={modalState.type === 'success' ? '' : 'text-red-600'}>
                {modalState.message}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            {modalState.type === 'success' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setModalState((prev) => ({ ...prev, open: false }))}
                >
                  Keep Editing
                </Button>
                <Button onClick={() => router.push('/libraries')}>Back to Libraries</Button>
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
        <h1 className="mb-2 text-3xl font-bold">Edit Library Settings</h1>
        <p className="mb-6 text-muted-foreground">
          Update settings for &quot;{library.name}&quot;. Only library administrators can make
          changes here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              required
            />
          </div>

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
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4">
            <input
              id="acceptsNewMembers"
              name="acceptsNewMembers"
              type="checkbox"
              checked={formData.acceptsNewMembers}
              onChange={handleInputChange}
              className="h-4 w-4"
            />
            <div className="flex-1">
              <Label htmlFor="acceptsNewMembers" className="cursor-pointer">
                Accepting new members
              </Label>
              <p className="text-sm text-muted-foreground">
                When disabled, neighbors cannot join this library until you turn this back on.
              </p>
            </div>
          </div>

          <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-2 text-sm font-medium">Service Area</legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  type="text"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
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
            </div>
          </fieldset>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/libraries')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
