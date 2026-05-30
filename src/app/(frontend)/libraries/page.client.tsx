'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { User, DistributedLibrary } from '@/payload-types'

interface LibrariesClientProps {
  user: User
}

export const LibrariesClient: React.FC<LibrariesClientProps> = ({ user }) => {
  const [libraries, setLibraries] = useState<DistributedLibrary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joiningLibraryId, setJoiningLibraryId] = useState<string | null>(null)

  const fetchLibraries = useCallback(async () => {
    try {
      const response = await fetch('/api/distributedLibraries?depth=1&limit=100')
      if (response.ok) {
        const data = await response.json()
        setLibraries(data.docs || [])
      }
    } catch (error) {
      console.error('Error fetching libraries:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLibraries()
  }, [fetchLibraries])

  const getMemberCount = (library: DistributedLibrary): number => {
    if (!library.members) return 0
    return Array.isArray(library.members) ? library.members.length : 0
  }

  const isMember = (library: DistributedLibrary): boolean => {
    if (!library.members || !Array.isArray(library.members)) return false
    return library.members.some((member) => {
      if (typeof member === 'string') return member === user.id
      return member.id === user.id
    })
  }

  const isAdmin = (library: DistributedLibrary): boolean => {
    if (!library.administrators || !Array.isArray(library.administrators)) return false
    return library.administrators.some((admin) => {
      if (typeof admin === 'string') return admin === user.id
      return admin.id === user.id
    })
  }

  const handleJoinLibrary = async (library: DistributedLibrary) => {
    setJoiningLibraryId(library.id)
    try {
      const currentMemberIds = (library.members || []).map((member) =>
        typeof member === 'string' ? member : member.id,
      )
      const updatedMembers = [...currentMemberIds, user.id]

      const response = await fetch(`/api/distributedLibraries/${library.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers }),
      })

      if (response.ok) {
        await fetchLibraries()
      } else {
        console.error('Failed to join library')
      }
    } catch (error) {
      console.error('Error joining library:', error)
    } finally {
      setJoiningLibraryId(null)
    }
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
          <Link href="/libraries/new" className="btn btn-primary">
            Start a Library
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}
      >
        {libraries.map((library) => {
          const memberCount = getMemberCount(library)
          const userIsMember = isMember(library)
          const userIsAdmin = isAdmin(library)
          const isJoining = joiningLibraryId === library.id

          return (
            <div
              key={library.id}
              className="card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '180px',
              }}
            >
              <div>
                <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>{library.name}</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                  {memberCount} {memberCount === 1 ? 'member' : 'members'} •{' '}
                  0 items
                </p>
              </div>
              <div style={{ marginTop: '1rem' }}>
                {userIsAdmin ? (
                  <span
                    style={{
                      fontSize: '0.85rem',
                      opacity: 0.7,
                    }}
                  >
                    Administrator
                  </span>
                ) : userIsMember ? (
                  <span
                    style={{
                      fontSize: '0.85rem',
                      opacity: 0.7,
                    }}
                  >
                    Joined
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleJoinLibrary(library)}
                    disabled={isJoining}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {isJoining ? 'Joining...' : 'Join Library'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {libraries.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.7 }}>
          <p>No libraries found. Start a new one!</p>
        </div>
      )}
    </main>
  )
}
