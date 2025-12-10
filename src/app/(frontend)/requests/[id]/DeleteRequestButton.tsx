'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteRequestButtonProps {
  requestId: string
  requestName: string
}

export function DeleteRequestButton({ requestId, requestName }: DeleteRequestButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete request')
      }

      // Redirect to dashboard after successful deletion
      router.push('/dashboard?deleted=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete request')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        Close Request
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Request</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to close &quot;{requestName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Closing...' : 'Yes, Close Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
