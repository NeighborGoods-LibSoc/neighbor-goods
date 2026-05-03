'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/payload-types'

interface DashboardClientProps {
  user: User
  showDeletedMessage?: boolean
}

interface Item {
  id: string
  name: string
  description: string
  loanId?: string
  dueDate?: string | null
  loanStatus?: string
  borrowerName?: string | null
}

interface LibrarySummary {
  id: string
  name: string
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
}

export const DashboardClient: React.FC<DashboardClientProps> = ({ user, showDeletedMessage }) => {
  const [borrowedItems, setBorrowedItems] = useState<Item[]>([])
  const [lentItems, setLentItems] = useState<Item[]>([])
  const [offeredItems, setOfferedItems] = useState<Item[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [adminLibraries, setAdminLibraries] = useState<LibrarySummary[]>([])
  const [activeTab, setActiveTab] = useState<'borrowing' | 'lending' | 'offering'>('borrowing')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch user's items and events
    const fetchDashboardData = async () => {
      try {
        // Fetch user's offered items
        const itemsResponse = await fetch('/api/items?where[offeredBy][equals]=' + user.id)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setOfferedItems(itemsData.docs || [])
        }

        // Fetch items the user is currently borrowing (active loans)
        const loansResponse = await fetch(
          '/api/loans?where[borrower][equals]=' +
            user.id +
            '&where[status][in]=BORROWED,OVERDUE&depth=1',
        )
        if (loansResponse.ok) {
          const loansData = await loansResponse.json()
          const borrowed = (loansData.docs || []).map((loan: any) => ({
            id: typeof loan.item === 'object' ? loan.item.id : loan.item,
            name: typeof loan.item === 'object' ? loan.item.name : 'Item',
            description:
              typeof loan.item === 'object' ? loan.item.description : '',
            loanId: loan.id,
            dueDate: loan.due_date,
            loanStatus: loan.status,
          }))
          setBorrowedItems(borrowed)
        }

        // Fetch items the user has lent out (active loans on their items)
        const lentResponse = await fetch(
          '/api/items?where[offeredBy][equals]=' +
            user.id +
            '&where[status][in]=BORROWED,WAITING_FOR_LENDER_APPROVAL_TO_BORROW&depth=1',
        )
        if (lentResponse.ok) {
          const lentData = await lentResponse.json()
          const lent = await Promise.all(
            (lentData.docs || []).map(async (item: any) => {
              // Try to find the active loan for this item
              let loanInfo: any = {}
              try {
                const loanRes = await fetch(
                  '/api/loans?where[item][equals]=' +
                    item.id +
                    '&where[status][in]=BORROWED,OVERDUE&depth=1&limit=1',
                )
                if (loanRes.ok) {
                  const loanData = await loanRes.json()
                  const loan = loanData.docs?.[0]
                  if (loan) {
                    loanInfo = {
                      loanId: loan.id,
                      dueDate: loan.due_date,
                      loanStatus: loan.status,
                      borrowerName:
                        typeof loan.borrower === 'object'
                          ? loan.borrower.name
                          : null,
                    }
                  }
                }
              } catch {}
              return {
                id: item.id,
                name: item.name,
                description: item.description || '',
                ...loanInfo,
              }
            }),
          )
          setLentItems(lent)
        }

        // TODO: Fetch events when events functionality is implemented
        setEvents([])

        // Fetch libraries where user is an administrator
        const librariesResponse = await fetch('/api/distributedLibraries?where[administrators][contains]=' + user.id + '&depth=0')
        if (librariesResponse.ok) {
          const librariesData = await librariesResponse.json()
          setAdminLibraries((librariesData.docs || []).map((lib: any) => ({ id: lib.id, name: lib.name })))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getJoinedDate = () => {
    return formatDate(user.createdAt)
  }

  if (isLoading) {
    return (
      <main className="container">
        <div className="loading">Loading dashboard...</div>
      </main>
    )
  }

  return (
    <main className="container">
      {showDeletedMessage && (
        <div
          className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          role="alert"
        >
          <strong>Success!</strong> Your item has been removed.
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>User Dashboard</h1>
        </div>
        <div className="flex gap-2">
          {adminLibraries.length > 0 && (
            <Link href={`/libraries/${adminLibraries[0].id}/moderate`} className="btn btn-secondary">
              Moderator Dashboard
            </Link>
          )}
          <Link href="/items/offer" className="btn btn-primary">
            Offer New Item
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="card">
        <div className="profile-top">
          <div className="avatar">
            <img src="/api/placeholder/120/120" alt="User Avatar" />
          </div>
          <div className="profile-name-section">
            <h1 className="profile-name">{user.name}</h1>
            <p>Member since {getJoinedDate()} • NeighborGoods</p>
            <div>
              <span className="trust-indicator">Verified Neighbor</span>
              <span className="trust-indicator">10+ Shares</span>
            </div>
          </div>
          <div className="profile-actions">
            <button className="btn btn-secondary">Edit Profile</button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard">
        {/* Quick Actions */}
        <div className="card">
          <h2>Quick Actions</h2>
          <ul className="quick-actions-grid">
            <Link href="/browse" className="btn btn-secondary">
              Browse Items
            </Link>
            <Link href="/items/request" className="btn btn-secondary">
              Request
            </Link>
            <Link href="/items/offer" className="btn btn-secondary">
              Offer
            </Link>
            <Link href="/my-items" className="btn btn-secondary">
              My Items
            </Link>
            <Link href="/libraries" className="btn btn-secondary">
              View Libraries
            </Link>
          </ul>
          {adminLibraries.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Your Libraries</h3>
              <ul className="space-y-1">
                {adminLibraries.map((lib) => (
                  <li key={lib.id}>
                    <Link href={`/libraries/${lib.id}/moderate`} className="btn btn-secondary block text-center">
                      Manage {lib.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <h2>Notifications</h2>
          <p>No new notifications.</p>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h2>Upcoming Events</h2>
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="list-item">
                <div className="list-item-title">{event.title}</div>
                <div className="list-item-description">{event.description}</div>
                <div className="list-item-meta">
                  <span>Date: {formatDate(event.date)}</span>
                  <span>Location: {event.location}</span>
                </div>
                <Link href={`/events/${event.id}`} className="action-button">
                  View Event
                </Link>
              </div>
            ))
          ) : (
            <p>No upcoming events.</p>
          )}
          <Link href="/events" className="view-all">
            View All Events
          </Link>
        </div>

        {/* Things Tabs */}
        <div className="card">
          <div className="tabs">
            <div
              className={`tab ${activeTab === 'borrowing' ? 'active' : ''}`}
              onClick={() => setActiveTab('borrowing')}
            >
              Borrowing {borrowedItems.length > 0 && `(${borrowedItems.length})`}
            </div>
            <div
              className={`tab ${activeTab === 'lending' ? 'active' : ''}`}
              onClick={() => setActiveTab('lending')}
            >
              Lent Out {lentItems.length > 0 && `(${lentItems.length})`}
            </div>
            <div
              className={`tab ${activeTab === 'offering' ? 'active' : ''}`}
              onClick={() => setActiveTab('offering')}
            >
              Offering
            </div>
          </div>
          <div className="borrowing-offering-grid">
            <div
              className={`borrowing-card tab-content ${activeTab === 'borrowing' ? 'active' : ''}`}
            >
              {borrowedItems.length > 0 ? (
                borrowedItems.map((item) => (
                  <div key={item.loanId || item.id} className="list-item">
                    <div className="list-item-title">{item.name}</div>
                    <div className="list-item-description">{item.description}</div>
                    {item.dueDate && (
                      <div className="list-item-meta">
                        <span>Due: {formatDate(item.dueDate)}</span>
                        {item.loanStatus === 'OVERDUE' && (
                          <span className="trust-indicator" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                            Overdue
                          </span>
                        )}
                      </div>
                    )}
                    <Link href={`/items/${item.id}`} className="action-button">
                      View Item
                    </Link>
                  </div>
                ))
              ) : (
                <p>You&apos;re not borrowing anything right now. <Link href="/browse" style={{ color: 'var(--primary)' }}>Browse available items</Link> to get started!</p>
              )}
            </div>
            <div
              className={`lending-card tab-content ${activeTab === 'lending' ? 'active' : ''}`}
            >
              {lentItems.length > 0 ? (
                lentItems.map((item) => (
                  <div key={item.id} className="list-item">
                    <div className="list-item-title">{item.name}</div>
                    {item.borrowerName && (
                      <div className="list-item-description">
                        Borrowed by <strong>{item.borrowerName}</strong>
                      </div>
                    )}
                    {item.dueDate && (
                      <div className="list-item-meta">
                        <span>Due: {formatDate(item.dueDate)}</span>
                        {item.loanStatus === 'OVERDUE' && (
                          <span className="trust-indicator" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                            Overdue
                          </span>
                        )}
                      </div>
                    )}
                    <Link href={`/items/${item.id}`} className="action-button">
                      Manage Item
                    </Link>
                  </div>
                ))
              ) : (
                <p>None of your items are currently lent out.</p>
              )}
            </div>
            <div
              className={`offering-card tab-content ${activeTab === 'offering' ? 'active' : ''}`}
            >
              {offeredItems.length > 0 ? (
                offeredItems.map((item) => (
                  <div key={item.id} className="list-item">
                    <div className="list-item-title">{item.name}</div>
                    <div className="list-item-description">{item.description}</div>
                    <Link href={`/items/${item.id}`} className="action-button">
                      View Item
                    </Link>
                  </div>
                ))
              ) : (
                <p>No items offered.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
