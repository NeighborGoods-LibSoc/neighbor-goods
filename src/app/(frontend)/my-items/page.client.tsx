'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User, Item, Request, Loan, Media, Tag } from '@/payload-types'

interface MyItemsClientProps {
  user: User
}

const itemStatusLabels: Record<string, string> = {
  READY: 'Available',
  BORROWED: 'Checked Out',
  RESERVED: 'Reserved',
  DAMAGED: 'Damaged',
  WAITING_FOR_LENDER_APPROVAL_TO_BORROW: 'Pending Approval',
}

const requestStatusLabels: Record<string, string> = {
  OPEN: 'Open',
  FULFILLED: 'Fulfilled',
  CLOSED: 'Closed',
}

const loanStatusLabels: Record<string, string> = {
  BORROWED: 'Borrowed',
  OVERDUE: 'Overdue',
  RETURN_STARTED: 'Return Started',
  WAITING_ON_LENDER_ACCEPTANCE: 'Awaiting Acceptance',
  RETURNED_DAMAGED: 'Returned Damaged',
  RETURNED: 'Returned',
}

export const MyItemsClient: React.FC<MyItemsClientProps> = ({ user }) => {
  const [offeredItems, setOfferedItems] = useState<Item[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [borrowedLoans, setBorrowedLoans] = useState<Loan[]>([])
  const [activeTab, setActiveTab] = useState<'offering' | 'requesting' | 'borrowing'>('offering')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMyItemsData = async () => {
      try {
        // Fetch user's offered items
        const itemsResponse = await fetch(`/api/items?where[offeredBy][equals]=${user.id}&depth=1&limit=100`)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setOfferedItems(itemsData.docs || [])
        }

        // Fetch user's requests
        const requestsResponse = await fetch(`/api/requests?where[requestedBy][equals]=${user.id}&depth=1&limit=100`)
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          setRequests(requestsData.docs || [])
        }

        // Fetch user's borrowed items (loans where user is borrower)
        const loansResponse = await fetch(`/api/loans?where[borrower][equals]=${user.id}&depth=2&limit=100`)
        if (loansResponse.ok) {
          const loansData = await loansResponse.json()
          setBorrowedLoans(loansData.docs || [])
        }
      } catch (error) {
        console.error('Error fetching my items data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyItemsData()
  }, [user.id])

  const getImageUrl = (image: Media | string | null | undefined): string | null => {
    if (!image) return null
    if (typeof image === 'string') return null
    return image.url || null
  }

  const getTagNames = (tags: (Tag | string)[] | null | undefined): string[] => {
    if (!tags) return []
    return tags
      .map((tag) => (typeof tag === 'string' ? null : tag.name))
      .filter((name): name is string => name !== null)
  }

  const getItemStatusClass = (status: string | null | undefined): string => {
    switch (status) {
      case 'READY': return 'status-ready'
      case 'BORROWED': return 'status-borrowed'
      case 'RESERVED': return 'status-reserved'
      case 'DAMAGED': return 'status-damaged'
      default: return 'status-pending'
    }
  }

  const getRequestStatusClass = (status: string | null | undefined): string => {
    switch (status) {
      case 'OPEN': return 'status-open'
      case 'FULFILLED': return 'status-fulfilled'
      case 'CLOSED': return 'status-closed'
      default: return 'status-open'
    }
  }

  const getLoanStatusClass = (status: string | null | undefined): string => {
    switch (status) {
      case 'BORROWED': return 'status-borrowed'
      case 'OVERDUE': return 'status-overdue'
      case 'RETURN_STARTED': return 'status-pending'
      case 'WAITING_ON_LENDER_ACCEPTANCE': return 'status-pending'
      case 'RETURNED': return 'status-ready'
      case 'RETURNED_DAMAGED': return 'status-damaged'
      default: return 'status-pending'
    }
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <main className="container">
        <div className="loading">Loading your items...</div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <h1>My Items</h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--muted-foreground)' }}>
            Manage your offered items, requests, and borrowed items
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/items/offer" className="btn btn-primary">
            Offer Item
          </Link>
          <Link href="/items/request" className="btn btn-secondary">
            Post Request
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'offering' ? 'active' : ''}`}
            onClick={() => setActiveTab('offering')}
            style={{ cursor: 'pointer' }}
          >
            Offering ({offeredItems.length})
          </div>
          <div
            className={`tab ${activeTab === 'requesting' ? 'active' : ''}`}
            onClick={() => setActiveTab('requesting')}
            style={{ cursor: 'pointer' }}
          >
            Requesting ({requests.length})
          </div>
          <div
            className={`tab ${activeTab === 'borrowing' ? 'active' : ''}`}
            onClick={() => setActiveTab('borrowing')}
            style={{ cursor: 'pointer' }}
          >
            Borrowing ({borrowedLoans.length})
          </div>
        </div>

        {/* Offering Tab Content */}
        <div className={`tab-content ${activeTab === 'offering' ? 'active' : ''}`}>
          {offeredItems.length > 0 ? (
            <div className="my-items-grid">
              {offeredItems.map((item) => {
                const imageUrl = getImageUrl(item.primaryImage as Media | string | null)
                const tagNames = getTagNames(item.tags as (Tag | string)[] | null)

                return (
                  <div key={item.id} className="my-items-card">
                    {imageUrl && (
                      <div className="my-items-card-image">
                        <img src={imageUrl} alt={item.name} />
                      </div>
                    )}
                    <div className="my-items-card-content">
                      <h3 className="my-items-card-title">{item.name}</h3>
                      <div className="my-items-card-meta">
                        <span className={`trust-indicator ${getItemStatusClass(item.status)}`}>
                          {itemStatusLabels[item.status] || item.status}
                        </span>
                      </div>
                      {item.description && (
                        <p className="my-items-card-description">
                          {item.description.length > 80
                            ? `${item.description.substring(0, 80)}...`
                            : item.description}
                        </p>
                      )}
                      {tagNames.length > 0 && (
                        <div className="my-items-card-tags">
                          {tagNames.slice(0, 3).map((tagName) => (
                            <span key={tagName} className="tag-badge">
                              {tagName}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="my-items-card-footer">
                        <Link href={`/items/${item.id}`} className="btn btn-secondary btn-sm">
                          View / Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven&apos;t offered any items yet.</p>
              <Link href="/items/offer" className="btn btn-primary">
                Offer your first item
              </Link>
            </div>
          )}
        </div>

        {/* Requesting Tab Content */}
        <div className={`tab-content ${activeTab === 'requesting' ? 'active' : ''}`}>
          {requests.length > 0 ? (
            <div className="my-items-grid">
              {requests.map((request) => {
                const imageUrl = getImageUrl(request.referenceImage as Media | string | null)
                const tagNames = getTagNames(request.tags as (Tag | string)[] | null)

                return (
                  <div key={request.id} className="my-items-card">
                    {imageUrl && (
                      <div className="my-items-card-image">
                        <img src={imageUrl} alt={request.name} />
                      </div>
                    )}
                    <div className="my-items-card-content">
                      <h3 className="my-items-card-title">{request.name}</h3>
                      <div className="my-items-card-meta">
                        <span className={`trust-indicator ${getRequestStatusClass(request.status)}`}>
                          {requestStatusLabels[request.status] || request.status}
                        </span>
                      </div>
                      {request.description && (
                        <p className="my-items-card-description">
                          {request.description.length > 80
                            ? `${request.description.substring(0, 80)}...`
                            : request.description}
                        </p>
                      )}
                      {tagNames.length > 0 && (
                        <div className="my-items-card-tags">
                          {tagNames.slice(0, 3).map((tagName) => (
                            <span key={tagName} className="tag-badge">
                              {tagName}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="my-items-card-footer">
                        <Link href={`/requests/${request.id}`} className="btn btn-secondary btn-sm">
                          View / Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven&apos;t posted any requests yet.</p>
              <Link href="/items/request" className="btn btn-primary">
                Post your first request
              </Link>
            </div>
          )}
        </div>

        {/* Borrowing Tab Content */}
        <div className={`tab-content ${activeTab === 'borrowing' ? 'active' : ''}`}>
          {borrowedLoans.length > 0 ? (
            <div className="my-items-grid">
              {borrowedLoans.map((loan) => {
                const item = loan.item as Item | null
                const imageUrl = item ? getImageUrl((item as Item & { primaryImage?: Media | string }).primaryImage) : null

                return (
                  <div key={loan.id} className="my-items-card">
                    {imageUrl && (
                      <div className="my-items-card-image">
                        <img src={imageUrl} alt={item?.name || 'Item'} />
                      </div>
                    )}
                    <div className="my-items-card-content">
                      <h3 className="my-items-card-title">{item?.name || 'Unknown Item'}</h3>
                      <div className="my-items-card-meta">
                        <span className={`trust-indicator ${getLoanStatusClass(loan.status)}`}>
                          {loanStatusLabels[loan.status] || loan.status}
                        </span>
                      </div>
                      <div className="my-items-card-dates">
                        {loan.due_date && (
                          <p className="date-info">
                            <strong>Due:</strong> {formatDate(loan.due_date)}
                          </p>
                        )}
                        {loan.time_returned && (
                          <p className="date-info">
                            <strong>Returned:</strong> {formatDate(loan.time_returned)}
                          </p>
                        )}
                      </div>
                      <div className="my-items-card-footer">
                        {item && (
                          <Link href={`/items/${item.id}`} className="btn btn-secondary btn-sm">
                            View Item
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>You&apos;re not currently borrowing any items.</p>
              <Link href="/inventory" className="btn btn-primary">
                Browse available items
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .my-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          padding: 1rem 0;
        }

        .my-items-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: var(--card);
          transition: box-shadow 0.2s ease;
        }

        .my-items-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .my-items-card-image {
          width: 100%;
          height: 160px;
          overflow: hidden;
        }

        .my-items-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .my-items-card-content {
          padding: 1rem;
        }

        .my-items-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .my-items-card-meta {
          margin-bottom: 0.5rem;
        }

        .my-items-card-description {
          font-size: 0.9rem;
          color: var(--muted-foreground);
          margin: 0 0 0.75rem 0;
          line-height: 1.4;
        }

        .my-items-card-dates {
          margin-bottom: 0.75rem;
        }

        .date-info {
          font-size: 0.85rem;
          color: var(--muted-foreground);
          margin: 0.25rem 0;
        }

        .my-items-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .tag-badge {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          background: var(--accent);
          border-radius: 12px;
          color: var(--accent-foreground);
        }

        .my-items-card-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }

        .btn-sm {
          padding: 0.25rem 0.75rem;
          font-size: 0.85rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-state p {
          margin-bottom: 1rem;
          color: var(--muted-foreground);
        }

        .status-ready {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-borrowed {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-reserved {
          background-color: #e0e7ff;
          color: #3730a3;
        }

        .status-damaged {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .status-pending {
          background-color: #f3f4f6;
          color: #374151;
        }

        .status-open {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .status-fulfilled {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-closed {
          background-color: #f3f4f6;
          color: #374151;
        }

        .status-overdue {
          background-color: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </main>
  )
}
