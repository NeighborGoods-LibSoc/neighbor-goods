'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/payload-types'

interface LibraryItem {
  id: string
  name: string
  location?: string
  administrators?: (string | { id: string })[]
  members?: (string | { id: string })[]
  items?: (string | { id: string })[]
}

interface LibrariesClientProps {
  user: User
}

export const LibrariesClient: React.FC<LibrariesClientProps> = ({ user }) => {
  const [libraries, setLibraries] = useState<LibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const response = await fetch('/api/distributedLibraries?depth=0&limit=100')
        if (response.ok) {
          const data = await response.json()
          setLibraries(data.docs || [])
        }
      } catch (error) {
        console.error('Error fetching libraries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLibraries()
  }, [])

  const isAdmin = (library: LibraryItem) => {
    if (!library.administrators) return false
    return library.administrators.some((admin) => {
      const adminId = typeof admin === 'string' ? admin : admin.id
      return adminId === user.id
    })
  }

  if (isLoading) {
    return (
      <main className="container">
        <div className="loading">Loading libraries...</div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <h1>Libraries</h1>
        </div>
        <div>
          <Link href="/libraries/create" className="btn btn-primary">
            Start a Library
          </Link>
        </div>
      </div>

      {libraries.length > 0 ? (
        <div className="dashboard">
          {libraries.map((library) => (
            <div key={library.id} className="card">
              <h2>{library.name}</h2>
              {library.location && <p className="text-sm text-muted-foreground">{library.location}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span>{Array.isArray(library.members) ? library.members.length : 0} members</span>
                <span>•</span>
                <span>{Array.isArray(library.items) ? library.items.length : 0} items</span>
              </div>
              {isAdmin(library) && (
                <div className="mt-4">
                  <Link href={`/libraries/${library.id}/moderate`} className="btn btn-secondary">
                    Manage
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>No libraries yet. Be the first to start one!</p>
        </div>
      )}
    </main>
  )
}
