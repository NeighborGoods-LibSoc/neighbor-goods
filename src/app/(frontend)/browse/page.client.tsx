'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import type { User } from '@/payload-types'

interface Tag {
  id: string
  name: string
  color?: string | null
}

interface ItemResult {
  id: string
  name: string
  description?: string | null
  status: string
  tags: Tag[]
  offeredBy?: { id: string; name?: string } | null
  primaryImage?: { url?: string; filename?: string } | null
  borrowingTime?: number | null
  libraryId?: string | null
  libraryName?: string | null
}

interface LibraryOption {
  id: string
  name: string
  area?: {
    center_point?: {
      city?: string | null
      state?: string | null
    } | null
    radius_kilometers?: number | null
  } | null
}

interface BrowseClientProps {
  user: User
}

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Available', value: 'READY' },
  { label: 'Borrowed', value: 'BORROWED' },
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Damaged', value: 'DAMAGED' },
]

const STATUS_LABELS: Record<string, string> = {
  READY: 'Available',
  WAITING_FOR_LENDER_APPROVAL_TO_BORROW: 'Pending Approval',
  BORROWED: 'Borrowed',
  DAMAGED: 'Damaged',
  RESERVED: 'Reserved',
}

const STATUS_COLORS: Record<string, string> = {
  READY: 'bg-green-100 text-green-800',
  WAITING_FOR_LENDER_APPROVAL_TO_BORROW: 'bg-yellow-100 text-yellow-800',
  BORROWED: 'bg-blue-100 text-blue-800',
  DAMAGED: 'bg-red-100 text-red-800',
  RESERVED: 'bg-purple-100 text-purple-800',
}

const ITEMS_PER_PAGE = 12

export const BrowseClient: React.FC<BrowseClientProps> = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedLibrary, setSelectedLibrary] = useState('')
  const [maxDistance, setMaxDistance] = useState('')

  const [items, setItems] = useState<ItemResult[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [libraries, setLibraries] = useState<LibraryOption[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [totalResults, setTotalResults] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Fetch tags and libraries on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/browse?action=filters')
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
          setLibraries(data.libraries || [])
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      }
    }

    fetchFilters()
  }, [])

  const fetchItems = useCallback(
    async (pageNum: number) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(ITEMS_PER_PAGE))
        params.set('page', String(pageNum))

        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim())
        }

        if (selectedStatus) {
          params.set('status', selectedStatus)
        }

        if (selectedLibrary) {
          params.set('library', selectedLibrary)
        }

        for (const tagId of selectedTags) {
          params.append('tag', tagId)
        }

        const response = await fetch(`/api/browse?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setItems(data.items || [])
          setTotalResults(data.totalItems || 0)
          setHasMore(data.hasNextPage || false)
        }
      } catch (error) {
        console.error('Error fetching items:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [searchQuery, selectedStatus, selectedTags, selectedLibrary],
  )

  // Fetch items when filters change
  useEffect(() => {
    setPage(1)
    fetchItems(1)
  }, [fetchItems])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchItems(1)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setSelectedStatus('')
    setSelectedLibrary('')
    setMaxDistance('')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchItems(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const getImageUrl = (item: ItemResult): string | null => {
    if (!item.primaryImage) return null
    return item.primaryImage.url || null
  }

  const getOfferedByName = (offeredBy: { id: string; name?: string } | null | undefined): string => {
    if (!offeredBy) return 'A neighbor'
    return offeredBy.name || 'A neighbor'
  }

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedStatus || selectedLibrary || maxDistance

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="page-header">
        <div>
          <h1>Browse Items</h1>
          <p className="mt-1 text-muted-foreground">
            Find things to borrow from your neighbors and local libraries
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
            {hasActiveFilters && (
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Availability filter */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Availability</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Library filter */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Library</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedLibrary}
                onChange={(e) => setSelectedLibrary(e.target.value)}
              >
                <option value="">All Libraries</option>
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name}
                    {lib.area?.center_point?.city ? ` (${lib.area.center_point.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance filter */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Max Distance (km)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Any distance"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
              />
            </div>
          </div>

          {/* Tags filter */}
          {availableTags.length > 0 && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? 'Searching...' : `${totalResults} item${totalResults !== 1 ? 's' : ''} found`}
      </div>

      {/* Results grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="mb-3 h-40 rounded bg-muted" />
              <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const imageUrl = getImageUrl(item)
            return (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                  {/* Image */}
                  <div className="relative h-48 bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                    {/* Status badge */}
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="mb-1 text-lg font-semibold">{item.name}</h3>

                    {item.description && (
                      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full border px-2 py-0.5 text-xs"
                            style={
                              tag.color
                                ? { borderColor: tag.color, color: tag.color }
                                : undefined
                            }
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Offered by {getOfferedByName(item.offeredBy)}</span>
                      {item.borrowingTime && <span>{item.borrowingTime}d loan</span>}
                    </div>

                    {/* Library info */}
                    {item.libraryName && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        📚 {item.libraryName}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground">No items found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && totalResults > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {Math.ceil(totalResults / ITEMS_PER_PAGE)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </main>
  )
}
