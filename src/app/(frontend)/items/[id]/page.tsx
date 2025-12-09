import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Item, Media, User, Tag } from '@/payload-types'
import { DeleteItemButton } from './DeleteItemButton'
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

  // Check if current user is the owner
  const isOwner = currentUser && offeredBy && currentUser.id === offeredBy.id

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
          &larr; Back to Dashboard
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

          {isOwner && (
            <div className="item-actions" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h3>Owner Actions</h3>
              <div style={{ marginTop: '0.5rem' }}>
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
