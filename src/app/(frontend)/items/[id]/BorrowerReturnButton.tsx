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

interface BorrowerReturnButtonProps {
  loanId: string
  itemName: string
}

/**
 * Button shown to the borrower of an active loan to start the return process.
 *
 * Transitions the loan from BORROWED -> RETURN_STARTED. The owning library's
 * `returnInitiator` (BORROWER for DistributedLibrary) is enforced server-side
 * in the loans collection hooks. After the borrower starts the return, the
 * lender confirms it by marking the item as returned/available.
 */
export function BorrowerReturnButton({ loanId, itemName }: BorrowerReturnButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartReturn = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'RETURN_STARTED',
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.errors?.[0]?.message || 'Failed to start return'
        setError(message)
        setIsSubmitting(false)
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start return')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="default" onClick={() => setIsOpen(true)}>
        Start Return
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Return</DialogTitle>
            <DialogDescription className="pt-2">
              Are you ready to return &quot;{itemName}&quot;? The lender will be notified
              and will confirm once they receive the item.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleStartReturn} disabled={isSubmitting}>
              {isSubmitting ? 'Starting Return...' : 'Yes, Start Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
