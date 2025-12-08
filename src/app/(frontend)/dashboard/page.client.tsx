'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/payload-types'

interface DashboardClientProps {
  user: User
}

interface Item {
  id: string
  name: string
  description: string
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
}

export const DashboardClient: React.FC<DashboardClientProps> = ({ user }) => {
  const [borrowedItems, setBorrowedItems] = useState<Item[]>([])
  const [offeredItems, setOfferedItems] = useState<Item[]>([])
  const [events, setEvents] = useState<Event[]>([])
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
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
        </div>
        <div>
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
            <Link href="#" className="btn btn-secondary">
              Request
            </Link>
            <Link href="/items/offer" className="btn btn-secondary">
              Offer
            </Link>
            <Link href="/items/transfers" className="btn btn-secondary">
              Manage Items
            </Link>
            <Link href="#" className="btn btn-secondary">
              Plan Event
            </Link>
          </ul>
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

        {/* Items Tabs */}
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
