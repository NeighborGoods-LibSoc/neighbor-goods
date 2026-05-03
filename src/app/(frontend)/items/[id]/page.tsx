import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Media, User, Tag } from '@/payload-types'
import { DeleteItemButton } from './DeleteItemButton'
import { RequestToBorrowButton } from './RequestToBorrowButton'
import { OwnerBorrowActions } from './OwnerBorrowActions'
import { getClientSideURL } from '@/utilities/getURL'

type Args = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    created?: string
  }>
}

export default async function ItemPage({ params: paramsPromise, searchParams: searchParamsPromise }: Args) {
  const { id } = await paramsPromise
  const { created } = await searchParamsPromise
  const isNewlyCreated = created === 'true'
  const payload = await getPayload({ config: configPromise })

  // Get current user to check ownership
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  let currentUser: User | null = null

  if (token) {
    try {
      const meUserReq = await fetch(`${getClientSideURL()}/api/users/me`, {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })
      if (meUserReq.ok) {
        const data = await meUserReq.json()
        currentUser = data.user
      }
    } catch {
      // User not logged in, that's fine
    }
  }

  const item = await payload.findByID({
    collection: 'items',
    id,
    depth: 2,
  }).catch(() => null)

  if (!item) {
    notFound()
  }

  const primaryImage = item.primaryImage as Media | null
  const offeredBy = item.offeredBy as User | null
  const tags = item.tags as Tag[] | null
  const requestedToBorrowBy = item.requestedToBorrowBy as User | null

  // Check if current user is the owner
  const isOwner = currentUser && offeredBy && currentUser.id === offeredBy.id

  // Check if current user can request to borrow (logged in, not owner, item is READY)
  const canRequestToBorrow = currentUser && !isOwner && item.status === 'READY'

  // Fetch active loan for this item if it's borrowed
  let activeLoan: { id: string; borrower: User | null; due_date: string | null; status: string } | null = null
  if (item.status === 'BORROWED') {
    try {
      const loanResult = await payload.find({
        collection: 'loans',
        where: {
          item: { equals: id },
          status: { in: ['BORROWED', 'OVERDUE'] },
        },
        depth: 1,
        limit: 1,
      })
      const loanDoc = loanResult.docs[0]
      if (loanDoc) {
        activeLoan = {
          id: loanDoc.id,
          borrower: (typeof loanDoc.borrower === 'object' ? loanDoc.borrower : null) as User | null,
          due_date: loanDoc.due_date || null,
          status: loanDoc.status,
        }
      }
    } catch {
      // Loan lookup failed, that's okay
    }
  }

  // Check if current user is the borrower of the active loan
  const isBorrower = currentUser && activeLoan?.borrower && currentUser.id === activeLoan?.borrower?.id

  return (
    <main className="container">
      {isNewlyCreated && (
        <div
          className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          role="alert"
        >
          <strong>Success!</strong> Your item has been created and is now available for borrowing.
        </div>
      )}

      <div className="page-header">
        <Link href="/dashboard" className="btn btn-secondary">
          &larr; Back to User Dashboard
        </Link>
      </div>

      <div className="card">
        <div className="item-detail">
          <h1>{item.name}</h1>
          <div className="item-status" style={{ marginBottom: '1rem' }}>
            <span className={`trust-indicator status-${item.status?.toLowerCase().replace(/_/g, '-')}`}>
              {getStatusLabel(item.status)}
            </span>
          </div>
          {primaryImage?.url && (
            <div className="item-image">
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || item.name}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
              />
            </div>
          )}

          {item.description && (
            <div className="item-description">
              <p>{item.description}</p>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div className="item-tags">
              <strong>Tags: </strong>
              {tags.map((tag) => (
                <span key={tag.id} className="trust-indicator">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="item-meta" style={{ marginTop: '1rem' }}>
            <p>
              <strong>Borrowing Time:</strong> {item.borrowingTime} days
            </p>
          </div>

          <div className="item-rules" style={{ marginTop: '1rem' }}>
            <h3>Rules for Use</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{item.rulesForUse}</p>
          </div>

          {offeredBy && (
            <div className="item-offered-by" style={{ marginTop: '1rem' }}>
              <p>
                <strong>Offered by:</strong> {offeredBy.name || 'Anonymous'}
              </p>
            </div>
          )}

          {/* Active loan info */}
          {activeLoan && (isOwner || isBorrower) && (
            <div className="item-loan-info" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Active Loan</h3>
              {isOwner && activeLoan.borrower && (
                <p><strong>Borrowed by:</strong> {activeLoan.borrower.name || 'A neighbor'}</p>
              )}
              {isBorrower && (
                <p><strong>You</strong> are currently borrowing this item.</p>
              )}
              {activeLoan.due_date && (
                <p>
                  <strong>Due date:</strong>{' '}
                  {new Date(activeLoan.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {activeLoan.status === 'OVERDUE' && (
                    <span style={{ marginLeft: '0.5rem', color: '#991b1b', fontWeight: 'bold' }}>
                      ⚠ Overdue
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Show Request to Borrow button for logged-in non-owners when item is available */}
          {canRequestToBorrow && (
            <div className="item-borrow-action" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <RequestToBorrowButton itemId={item.id} itemName={item.name} />
            </div>
          )}

          {/* Show login prompt for non-logged-in users viewing available items */}
          {!currentUser && item.status === 'READY' && (
            <div className="item-borrow-action" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--muted-foreground)' }}>
                <Link href="/login" style={{ color: 'var(--primary)' }}>Log in</Link> to request this item.
              </p>
            </div>
          )}

          {isOwner && (
            <div className="item-actions" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h3>Owner Actions</h3>
              <div style={{ marginTop: '0.75rem' }}>
                <OwnerBorrowActions
                  itemId={item.id}
                  itemName={item.name}
                  currentStatus={item.status || 'READY'}
                  requesterName={requestedToBorrowBy?.name}
                />
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <DeleteItemButton itemId={item.id} itemName={item.name} />
              </div>
            </div>
          )}

          {item.additional_images && (item.additional_images as Media[]).length > 0 && (
            <div className="additional-images" style={{ marginTop: '2rem' }}>
              <h3>Additional Images</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {(item.additional_images as Media[]).map(
                  (img) =>
                    img.url && (
                      <img
                        key={img.id}
                        src={img.url}
                        alt={img.alt || item.name}
                        style={{ maxWidth: '200px', height: 'auto', borderRadius: '8px' }}
                      />
                    ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

const statusLabels: Record<string, string> = {
  READY: 'Available',
  WAITING_FOR_LENDER_APPROVAL_TO_BORROW: 'Pending Approval',
  BORROWED: 'Checked Out',
  DAMAGED: 'Damaged',
  RESERVED: 'Reserved',
}

function getStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  return statusLabels[status] || status
}
