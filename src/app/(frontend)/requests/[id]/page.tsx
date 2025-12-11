import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Media, User, Tag } from '@/payload-types'
import { DeleteRequestButton } from './DeleteRequestButton'
import { getClientSideURL } from '@/utilities/getURL'

type Args = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    created?: string
  }>
}

export default async function RequestPage({ params: paramsPromise, searchParams: searchParamsPromise }: Args) {
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

  const request = await payload.findByID({
    collection: 'requests',
    id,
    depth: 2,
  }).catch(() => null)

  if (!request) {
    notFound()
  }

  const referenceImage = request.referenceImage as Media | null
  const requestedBy = request.requestedBy as User | null
  const tags = request.tags as Tag[] | null

  // Check if current user is the owner
  const isOwner = currentUser && requestedBy && currentUser.id === requestedBy.id

  return (
    <main className="container">
      {isNewlyCreated && (
        <div
          className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          role="alert"
        >
          <strong>Success!</strong> Your request has been posted and is now visible to your neighbors.
        </div>
      )}

      <div className="page-header">
        <Link href="/dashboard" className="btn btn-secondary">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <div className="item-detail">
          <h1>{request.name}</h1>
          <div className="item-status" style={{ marginBottom: '1rem' }}>
            <span className={`trust-indicator status-${request.status?.toLowerCase()}`}>
              {getStatusLabel(request.status)}
            </span>
          </div>

          {referenceImage?.url && (
            <div className="item-image">
              <img
                src={referenceImage.url}
                alt={referenceImage.alt || request.name}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
              />
            </div>
          )}

          {request.description && (
            <div className="item-description">
              <p>{request.description}</p>
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

          {requestedBy && (
            <div className="item-offered-by" style={{ marginTop: '1rem' }}>
              <p>
                <strong>Requested by:</strong> {requestedBy.name || 'Anonymous'}
              </p>
            </div>
          )}

          {isOwner && (
            <div className="item-actions" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h3>Owner Actions</h3>
              <div style={{ marginTop: '0.5rem' }}>
                <DeleteRequestButton requestId={request.id} requestName={request.name} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  FULFILLED: 'Fulfilled',
  CLOSED: 'Closed',
}

function getStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown'
  return statusLabels[status] || status
}
