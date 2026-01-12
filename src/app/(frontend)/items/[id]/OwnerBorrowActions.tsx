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

interface OwnerBorrowActionsProps {
  itemId: string
  itemName: string
  currentStatus: string
  requesterName?: string | null
}

type ActionType = 'approve_reserved' | 'approve_borrowed' | 'reject' | 'mark_borrowed' | 'mark_ready' | 'mark_damaged' | null

export function OwnerBorrowActions({
  itemId,
  itemName,
  currentStatus,
  requesterName,
}: OwnerBorrowActionsProps) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.errors?.[0]?.message || 'Failed to update item status')
      }

      setActiveAction(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item status')
      setIsSubmitting(false)
    }
  }

  const getDialogContent = () => {
    switch (activeAction) {
      case 'approve_reserved':
        return {
          title: 'Reserve Item',
          description: `Reserve "${itemName}" for ${requesterName || 'the requester'}? They will need to pick it up to complete the borrow.`,
          confirmText: 'Yes, Reserve',
          newStatus: 'RESERVED',
        }
      case 'approve_borrowed':
        return {
          title: 'Mark as Borrowed',
          description: `Mark "${itemName}" as borrowed by ${requesterName || 'the requester'}?`,
          confirmText: 'Yes, Mark Borrowed',
          newStatus: 'BORROWED',
        }
      case 'reject':
        return {
          title: 'Decline Request',
          description: `Decline the borrow request for "${itemName}" from ${requesterName || 'the requester'}? The item will return to available status.`,
          confirmText: 'Yes, Decline',
          newStatus: 'READY',
        }
      case 'mark_borrowed':
        return {
          title: 'Mark as Borrowed',
          description: `Mark "${itemName}" as currently borrowed?`,
          confirmText: 'Yes, Mark Borrowed',
          newStatus: 'BORROWED',
        }
      case 'mark_ready':
        return {
          title: 'Mark as Available',
          description: `Mark "${itemName}" as available for borrowing again?`,
          confirmText: 'Yes, Mark Available',
          newStatus: 'READY',
        }
      case 'mark_damaged':
        return {
          title: 'Mark as Damaged',
          description: `Mark "${itemName}" as damaged? It will no longer be available for borrowing until repaired.`,
          confirmText: 'Yes, Mark Damaged',
          newStatus: 'DAMAGED',
        }
      default:
        return null
    }
  }

  const dialogContent = getDialogContent()

  // Render different action buttons based on current status
  const renderActions = () => {
    switch (currentStatus) {
      case 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW':
        return (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => setActiveAction('approve_reserved')}>
              Reserve for Pickup
            </Button>
            <Button onClick={() => setActiveAction('approve_borrowed')}>
              Mark as Borrowed
            </Button>
            <Button variant="outline" onClick={() => setActiveAction('reject')}>
              Decline Request
            </Button>
          </div>
        )

      case 'RESERVED':
        return (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => setActiveAction('mark_borrowed')}>
              Mark as Borrowed
            </Button>
            <Button variant="outline" onClick={() => setActiveAction('mark_ready')}>
              Cancel Reservation
            </Button>
          </div>
        )

      case 'BORROWED':
        return (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => setActiveAction('mark_ready')}>
              Mark as Returned
            </Button>
            <Button variant="destructive" onClick={() => setActiveAction('mark_damaged')}>
              Mark as Damaged
            </Button>
          </div>
        )

      case 'DAMAGED':
        return (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button onClick={() => setActiveAction('mark_ready')}>
              Mark as Repaired
            </Button>
          </div>
        )

      case 'READY':
      default:
        return (
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            Item is available. No pending actions.
          </p>
        )
    }
  }

  return (
    <>
      <div className="owner-borrow-actions">
        <h4 style={{ marginBottom: '0.75rem' }}>Manage Item Status</h4>
        {requesterName && currentStatus === 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW' && (
          <p style={{ marginBottom: '0.75rem', color: 'var(--muted-foreground)' }}>
            <strong>{requesterName}</strong> has requested to borrow this item.
          </p>
        )}
        {renderActions()}
      </div>

      <Dialog open={activeAction !== null} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription className="pt-2">{dialogContent?.description}</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActiveAction(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={activeAction === 'reject' || activeAction === 'mark_damaged' ? 'destructive' : 'default'}
              onClick={() => dialogContent && handleStatusChange(dialogContent.newStatus)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : dialogContent?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
