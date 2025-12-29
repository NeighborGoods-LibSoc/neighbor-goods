'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User, Item, ThingRequest, Media, Tag } from '@/payload-types'

interface InventoryClientProps {
  user: User
}


const itemStatusOptions = [
  { value: 'READY', label: 'Available' },
  { value: 'BORROWED', label: 'Checked Out' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WAITING_FOR_LENDER_APPROVAL_TO_BORROW', label: 'Pending Approval' },
]

const requestStatusOptions = [
  { value: 'OPEN', label: 'Open' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'CLOSED', label: 'Closed' },
]

const allItemStatuses = itemStatusOptions.map((o) => o.value)
const allRequestStatuses = requestStatusOptions.map((o) => o.value)

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

export const InventoryClient: React.FC<InventoryClientProps> = ({ user }) => {
  const [items, setItems] = useState<Item[]>([])
  const [requests, setRequests] = useState<ThingRequest[]>([])
  const [activeTab, setActiveTab] = useState<'offers' | 'requests'>('offers')
  const [selectedItemStatuses, setSelectedItemStatuses] = useState<string[]>(allItemStatuses)
  const [selectedRequestStatuses, setSelectedRequestStatuses] = useState<string[]>(allRequestStatuses)
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        // Fetch all items
        const itemsResponse = await fetch('/api/items?depth=1&limit=100')
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setItems(itemsData.docs || [])
        }

        // Fetch all requests
        const requestsResponse = await fetch('/api/thing-requests?depth=1&limit=100')
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          setRequests(requestsData.docs || [])
        }
      } catch (error) {
        console.error('Error fetching inventory data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInventoryData()
  }, [])

  const filteredItems = items.filter((item) => selectedItemStatuses.includes(item.status))

  const filteredRequests = requests.filter((request) => selectedRequestStatuses.includes(request.status))

  const toggleItemStatus = (status: string) => {
    setSelectedItemStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const toggleRequestStatus = (status: string) => {
    setSelectedRequestStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const selectAllItemStatuses = () => setSelectedItemStatuses(allItemStatuses)
  const deselectAllItemStatuses = () => setSelectedItemStatuses([])
  const selectAllRequestStatuses = () => setSelectedRequestStatuses(allRequestStatuses)
  const deselectAllRequestStatuses = () => setSelectedRequestStatuses([])

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

  const getUserName = (ownerOrRequester: User | string | null | undefined): string => {
    if (!ownerOrRequester) return 'Anonymous'
    if (typeof ownerOrRequester === 'string') return 'Anonymous'
    return ownerOrRequester.name || 'Anonymous'
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

  if (isLoading) {
    return (
      <main className="container">
        <div className="loading">Loading inventory...</div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--muted-foreground)' }}>
            Browse all items and requests available in your community
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
            className={`tab ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
            style={{ cursor: 'pointer' }}
          >
            Offered Items ({filteredItems.length})
          </div>
          <div
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            style={{ cursor: 'pointer' }}
          >
            Requests ({filteredRequests.length})
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-dropdown">
            <button
              type="button"
              className="filter-dropdown-trigger"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-expanded={isFilterOpen}
              aria-haspopup="true"
            >
              <span className="filter-dropdown-label">Status</span>
              <span className="filter-dropdown-count">
                {activeTab === 'offers'
                  ? selectedItemStatuses.length === allItemStatuses.length
                    ? 'All'
                    : `${selectedItemStatuses.length}/${allItemStatuses.length}`
                  : selectedRequestStatuses.length === allRequestStatuses.length
                    ? 'All'
                    : `${selectedRequestStatuses.length}/${allRequestStatuses.length}`}
              </span>
              <svg
                className={`filter-dropdown-icon ${isFilterOpen ? 'open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 4.5L6 8L9.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isFilterOpen && (
              <div className="filter-dropdown-menu">
                <div className="filter-dropdown-actions">
                  <button
                    type="button"
                    onClick={activeTab === 'offers' ? selectAllItemStatuses : selectAllRequestStatuses}
                    className="filter-action-btn"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={activeTab === 'offers' ? deselectAllItemStatuses : deselectAllRequestStatuses}
                    className="filter-action-btn"
                  >
                    Clear
                  </button>
                </div>
                <div className="filter-dropdown-options">
                  {activeTab === 'offers'
                    ? itemStatusOptions.map((option) => (
                        <label key={option.value} className="filter-dropdown-option">
                          <input
                            type="checkbox"
                            checked={selectedItemStatuses.includes(option.value)}
                            onChange={() => toggleItemStatus(option.value)}
                            className="filter-checkbox"
                          />
                          <span className="filter-checkbox-text">
                            {option.label}
                          </span>
                        </label>
                      ))
                    : requestStatusOptions.map((option) => (
                        <label key={option.value} className="filter-dropdown-option">
                          <input
                            type="checkbox"
                            checked={selectedRequestStatuses.includes(option.value)}
                            onChange={() => toggleRequestStatus(option.value)}
                            className="filter-checkbox"
                          />
                          <span className="filter-checkbox-text">
                            {option.label}
                          </span>
                        </label>
                      ))}
                </div>
              </div>
            )}
          </div>
          {/* Click outside to close */}
          {isFilterOpen && (
            <div
              className="filter-dropdown-backdrop"
              onClick={() => setIsFilterOpen(false)}
            />
          )}
        </div>

        {/* Offers Tab Content */}
        <div className={`tab-content ${activeTab === 'offers' ? 'active' : ''}`}>
          {filteredItems.length > 0 ? (
            <div className="inventory-grid">
              {filteredItems.map((item) => {
                const imageUrl = getImageUrl(item.primaryImage)
                const tagNames = getTagNames(item.tags)
                const ownerName = getUserName(item.offeredBy)

                return (
                  <div key={item.id} className="inventory-card">
                    {imageUrl && (
                      <div className="inventory-card-image">
                        <img src={imageUrl} alt={item.name} />
                      </div>
                    )}
                    <div className="inventory-card-content">
                      <h3 className="inventory-card-title">{item.name}</h3>
                      <div className="inventory-card-meta">
                        <span className={`trust-indicator ${getItemStatusClass(item.status)}`}>
                          {itemStatusLabels[item.status || 'READY'] || item.status}
                        </span>
                      </div>
                      {item.description && (
                        <p className="inventory-card-description">
                          {item.description.length > 100
                            ? `${item.description.substring(0, 100)}...`
                            : item.description}
                        </p>
                      )}
                      {tagNames.length > 0 && (
                        <div className="inventory-card-tags">
                          {tagNames.slice(0, 3).map((tagName) => (
                            <span key={tagName} className="tag-badge">
                              {tagName}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="inventory-card-footer">
                        <span className="inventory-card-owner">by {ownerName}</span>
                        <Link href={`/items/${item.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {selectedItemStatuses.length === 0
                  ? 'No statuses selected. Use the filters above to show items.'
                  : 'No items match the selected filters.'}
              </p>
              {selectedItemStatuses.length > 0 && (
                <Link href="/items/offer" className="btn btn-primary">
                  Offer an item
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ThingRequests Tab Content */}
        <div className={`tab-content ${activeTab === 'requests' ? 'active' : ''}`}>
          {filteredRequests.length > 0 ? (
            <div className="inventory-grid">
              {filteredRequests.map((request) => {
                const imageUrl = getImageUrl(request.referenceImage)
                const tagNames = getTagNames(request.tags)
                const requesterName = getUserName(request.requestedBy)

                return (
                  <div key={request.id} className="inventory-card">
                    {imageUrl && (
                      <div className="inventory-card-image">
                        <img src={imageUrl} alt={request.name} />
                      </div>
                    )}
                    <div className="inventory-card-content">
                      <h3 className="inventory-card-title">{request.name}</h3>
                      <div className="inventory-card-meta">
                        <span className={`trust-indicator ${getRequestStatusClass(request.status)}`}>
                          {requestStatusLabels[request.status || 'OPEN'] || request.status}
                        </span>
                      </div>
                      {request.description && (
                        <p className="inventory-card-description">
                          {request.description.length > 100
                            ? `${request.description.substring(0, 100)}...`
                            : request.description}
                        </p>
                      )}
                      {tagNames.length > 0 && (
                        <div className="inventory-card-tags">
                          {tagNames.slice(0, 3).map((tagName) => (
                            <span key={tagName} className="tag-badge">
                              {tagName}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="inventory-card-footer">
                        <span className="inventory-card-owner">by {requesterName}</span>
                        <Link href={`/thing-requests/${request.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>
                {selectedRequestStatuses.length === 0
                  ? 'No statuses selected. Use the filters above to show requests.'
                  : 'No requests match the selected filters.'}
              </p>
              {selectedRequestStatuses.length > 0 && (
                <Link href="/items/request" className="btn btn-primary">
                  Post a request
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .filter-section {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          background: var(--accent);
        }

        .filter-dropdown {
          position: relative;
          display: inline-block;
        }

        .filter-dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--background);
          cursor: pointer;
          transition: all 0.2s;
          min-width: 140px;
        }

        .filter-dropdown-trigger:hover {
          border-color: var(--primary);
        }

        .filter-dropdown-label {
          font-weight: 500;
          color: var(--foreground);
        }

        .filter-dropdown-count {
          font-size: 0.8rem;
          color: var(--muted-foreground);
          background: var(--accent);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .filter-dropdown-icon {
          margin-left: auto;
          transition: transform 0.2s;
          color: var(--muted-foreground);
        }

        .filter-dropdown-icon.open {
          transform: rotate(180deg);
        }

        .filter-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          z-index: 50;
          min-width: 200px;
          background-color: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .filter-dropdown-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
          background: var(--accent);
        }

        .filter-action-btn {
          flex: 1;
          padding: 0.35rem 0.5rem;
          font-size: 0.8rem;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: var(--background);
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .filter-action-btn:hover {
          background: var(--border);
        }

        .filter-dropdown-options {
          padding: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .filter-dropdown-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.15s;
        }

        .filter-dropdown-option:hover {
          background: var(--accent);
        }

        .filter-checkbox {
          cursor: pointer;
          width: 1rem;
          height: 1rem;
          flex-shrink: 0;
        }

        .filter-checkbox-text {
          font-size: 0.85rem;
        }

        .filter-dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
        }

        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          padding: 1rem 0;
        }

        .inventory-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: var(--card);
          transition: box-shadow 0.2s ease;
        }

        .inventory-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .inventory-card-image {
          width: 100%;
          height: 180px;
          overflow: hidden;
        }

        .inventory-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .inventory-card-content {
          padding: 1rem;
        }

        .inventory-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .inventory-card-meta {
          margin-bottom: 0.5rem;
        }

        .inventory-card-description {
          font-size: 0.9rem;
          color: var(--muted-foreground);
          margin: 0 0 0.75rem 0;
          line-height: 1.4;
        }

        .inventory-card-tags {
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

        .inventory-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }

        .inventory-card-owner {
          font-size: 0.85rem;
          color: var(--muted-foreground);
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
      `}</style>
    </main>
  )
}
