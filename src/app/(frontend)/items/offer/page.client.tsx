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

interface OfferClientProps {
  user: any
}

interface Tag {
  id: string
  name: string
}

export const OfferClient: React.FC<OfferClientProps> = ({ user }) => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rulesForUse: '',
    borrowingTime: '',
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
    itemId?: string
    itemName?: string
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
      rulesForUse: '',
      borrowingTime: '',
      agreeToTerms: false,
    })
    setImageFile(null)
    setImagePreview('')
    setSelectedTags([])
  }

  const handleGoToItem = () => {
    if (modalState.itemId) {
      router.push(`/items/${modalState.itemId}?created=true`)
    }
  }

  const handleOfferAnother = () => {
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
      if (!formData.rulesForUse.trim()) {
        throw new Error('Rules for use are required')
      }
      if (!formData.borrowingTime || Number(formData.borrowingTime) <= 0) {
        throw new Error('Valid borrowing time is required')
      }
      if (!imageFile) {
        throw new Error('Image is required')
      }
      if (!formData.agreeToTerms) {
        throw new Error('You must agree to the terms and conditions')
      }

      // First upload the image to get media ID
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
      const mediaId = mediaData.doc.id

      // Prepare item data
      const itemData = {
        name: formData.name,
        description: formData.description || '',
        rulesForUse: formData.rulesForUse,
        borrowingTime: Number(formData.borrowingTime),
        primaryImage: mediaId,
        offeredBy: user.id,
        tags: selectedTags,
      }

      // Submit item
      const itemResponse = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      if (!itemResponse.ok) {
        throw new Error('Failed to create item')
      }

      const itemResult = await itemResponse.json()

      setModalState({
        open: true,
        type: 'success',
        message: 'Your item has been successfully added!',
        itemId: itemResult.doc.id,
        itemName: formData.name,
      })
    } catch (error) {
      setModalState({
        open: true,
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit item',
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
              {modalState.type === 'success' ? 'Item Created Successfully!' : 'Error'}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {modalState.type === 'success' ? (
                <>
                  <span className="block text-base">{modalState.message}</span>
                  {modalState.itemName && (
                    <span className="mt-2 block font-medium text-foreground">
                      &quot;{modalState.itemName}&quot; is now available for your neighbors to borrow.
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
                <Button variant="outline" onClick={handleOfferAnother}>
                  Offer Another Item
                </Button>
                <Button onClick={handleGoToItem}>
                  View Item
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
        <h1 className="mb-6 text-3xl font-bold">Offer an Item</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Item Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter item name"
              required
            />
          </div>

          {/* Picture */}
          <div className="space-y-2">
            <Label htmlFor="picture">
              Picture <span className="text-red-500">*</span>
            </Label>
            <Input
              id="picture"
              name="picture"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
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

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your item (optional)"
              rows={4}
            />
          </div>

          {/* Tags (Optional) */}
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

          {/* Rules for Use */}
          <div className="space-y-2">
            <Label htmlFor="rulesForUse">
              Rules for Use <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rulesForUse"
              name="rulesForUse"
              value={formData.rulesForUse}
              onChange={handleInputChange}
              placeholder="Enter rules and guidelines for using this item"
              rows={4}
              required
            />
          </div>

          {/* Borrowing Time */}
          <div className="space-y-2">
            <Label htmlFor="borrowingTime">
              Maximum Borrowing Time (days) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="borrowingTime"
              name="borrowingTime"
              type="number"
              min="1"
              value={formData.borrowingTime}
              onChange={handleInputChange}
              placeholder="Enter number of days"
              required
            />
          </div>

          {/* Agree to Terms (Placeholder) */}
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
            {isSubmitting ? 'Submitting...' : 'Submit Item'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
