import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PayloadItemRepository } from '@/infrastructure/repositories/PayloadItemRepository'
import { ItemSearchService } from '@/domain/services/ItemSearchService'
import type { ItemSearchFilters } from '@/domain/repositories/ItemRepository'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const repo = new PayloadItemRepository(payload)
    const service = new ItemSearchService(repo)

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'tags') {
      const tags = await service.getAvailableTags()
      return NextResponse.json({ tags })
    }

    if (action === 'libraries') {
      const libraries = await service.getAvailableLibraries()
      return NextResponse.json({ libraries })
    }

    if (action === 'filters') {
      const [tags, libraries] = await Promise.all([
        service.getAvailableTags(),
        service.getAvailableLibraries(),
      ])
      return NextResponse.json({ tags, libraries })
    }

    // Default: search items
    const filters: ItemSearchFilters = {
      searchQuery: searchParams.get('q') || undefined,
      status: searchParams.get('status') || undefined,
      tagIds: searchParams.getAll('tag').filter(Boolean),
      libraryId: searchParams.get('library') || undefined,
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10))),
    }

    const result = await service.search(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Browse API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while searching items' },
      { status: 500 },
    )
  }
}
