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

interface RequestToBorrowButtonProps {
  itemId: string
  itemName: string
}

export function RequestToBorrowButton({ itemId, itemName }: RequestToBorrowButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestToBorrow = async () => {
    setIsRequesting(true)
    setError(null)

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.errors?.[0]?.message || 'Failed to request item')
      }

      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request item')
      setIsRequesting(false)
    }
  }

  return (
    <>
      <Button variant="default" onClick={() => setIsOpen(true)}>
        Request to Borrow
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Borrow</DialogTitle>
            <DialogDescription className="pt-2">
              Would you like to request to borrow &quot;{itemName}&quot;? The owner will be notified
              and can approve or decline your request.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isRequesting}>
              Cancel
            </Button>
            <Button onClick={handleRequestToBorrow} disabled={isRequesting}>
              {isRequesting ? 'Requesting...' : 'Yes, Request Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
