'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RequestClientProps {
  user: any
}

interface Tag {
  id: string
  name: string
}

export const RequestClient: React.FC<RequestClientProps> = ({ user }) => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agreeToTerms: false,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalState, setModalState] = useState<{
    open: boolean
    type: 'success' | 'error'
    message: string
    requestId?: string
    requestName?: string
  }>({ open: false, type: 'success', message: '' })

  // Fetch available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.docs || [])
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreeToTerms: checked,
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      agreeToTerms: false,
    })
    setImageFile(null)
    setImagePreview('')
    setSelectedTags([])
  }

  const handleGoToRequest = () => {
    if (modalState.requestId) {
      router.push(`/thing-requests/${modalState.requestId}?created=true`)
    }
  }

  const handleRequestAnother = () => {
    setModalState({ open: false, type: 'success', message: '' })
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Name is required')
      }
      if (!formData.agreeToTerms) {
        throw new Error('You must agree to the terms and conditions')
      }

      let mediaId = null

      // Upload image if provided (optional for requests)
      if (imageFile) {
        const mediaFormData = new FormData()
        mediaFormData.append('file', imageFile)

        const mediaResponse = await fetch('/api/media', {
          method: 'POST',
          body: mediaFormData,
        })

        if (!mediaResponse.ok) {
          throw new Error('Failed to upload image')
        }

        const mediaData = await mediaResponse.json()
        mediaId = mediaData.doc.id
      }

      // Prepare request data
      const requestData: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || '',
        requestedBy: user.id,
        tags: selectedTags,
      }

      if (mediaId) {
        requestData.referenceImage = mediaId
      }

      // Submit request
      const requestResponse = await fetch('/api/thing-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!requestResponse.ok) {
        throw new Error('Failed to create request')
      }

      const requestResult = await requestResponse.json()

      setModalState({
        open: true,
        type: 'success',
        message: 'Your request has been successfully posted!',
        requestId: requestResult.doc.id,
        requestName: formData.name,
      })
    } catch (error) {
      setModalState({
        open: true,
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit request',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Dialog open={modalState.open} onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={modalState.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {modalState.type === 'success' ? 'Request Posted Successfully!' : 'Error'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {modalState.type === 'success' ? (
                <>
                  <span className="block text-base">{modalState.message}</span>
                  {modalState.requestName && (
                    <span className="mt-2 block font-medium text-foreground">
                      Your request for &quot;{modalState.requestName}&quot; is now visible to your neighbors.
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
                <Button variant="outline" onClick={handleRequestAnother}>
                  Request Another
                </Button>
                <Button onClick={handleGoToRequest}>
                  View Request
                </Button>
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
        <h1 className="mb-6 text-3xl font-bold">Request an Item or Service</h1>
        <p className="mb-6 text-muted-foreground">
          Looking for something that isn&apos;t currently available? Post a request and let your neighbors know what you need.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              What are you looking for? <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Ladder, Power drill, Camping tent"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what you need"
              rows={4}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            {availableTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <label
                    key={tag.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedTags.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags([...selectedTags, tag.id])
                        } else {
                          setSelectedTags(selectedTags.filter((id) => id !== tag.id))
                        }
                      }}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags available</p>
            )}
          </div>

          {/* Reference Image (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="picture">Reference Image (optional)</Label>
            <Input
              id="picture"
              name="picture"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <p className="text-sm text-muted-foreground">
              Upload an example image to help others understand what you&apos;re looking for
            </p>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-48 w-auto rounded border object-cover"
                />
              </div>
            )}
          </div>

          {/* Agree to Terms */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="agreeToTerms" className="cursor-pointer text-sm font-normal">
              I agree to the terms and conditions (to be added)
            </Label>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Post Request'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
