'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { User } from '@/payload-types'

interface DashboardClientProps {
  user: User
  showDeletedMessage?: boolean
}

interface Item {
  id: string
  name: string
  description: string
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
  const [offeredItems, setOfferedItems] = useState<Item[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [adminLibraries, setAdminLibraries] = useState<LibrarySummary[]>([])
  const [activeTab, setActiveTab] = useState<'borrowing' | 'offering'>('borrowing')
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

        // TODO: Fetch borrowed items when borrowing functionality is implemented
        setBorrowedItems([])

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
            <Image src="/api/placeholder/120/120" alt="User Avatar" width={120} height={120} />
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
              Borrowing
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
                  <div key={item.id} className="list-item">
                    <div className="list-item-title">{item.name}</div>
                    <div className="list-item-description">{item.description}</div>
                    <Link href={`/items/${item.id}`} className="action-button">
                      View Item
                    </Link>
                  </div>
                ))
              ) : (
                <p>No items borrowed.</p>
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
