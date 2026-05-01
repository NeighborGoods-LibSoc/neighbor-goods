import type {
  ItemRepository,
  ItemSearchFilters,
  TagRecord,

} from '@/domain/repositories'

export interface BrowseItemResult {
  id: string
  name: string
  description?: string | null
  status: string
  tags: { id: string; name: string; color?: string | null }[]
  offeredBy?: { id: string; name?: string } | null
  primaryImage?: { url?: string; filename?: string } | null
  borrowingTime?: number | null
  libraryId?: string | null
  libraryName?: string | null
}

export interface BrowseLibraryOption {
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

export interface BrowseResult {
  items: BrowseItemResult[]
  totalItems: number
  hasNextPage: boolean
}

export class ItemSearchService {
  constructor(private itemRepo: ItemRepository) {}

  async search(filters: ItemSearchFilters): Promise<BrowseResult> {
    // If filtering by library, get the library's item IDs first
    let searchResult
    if (filters.libraryId) {
      const libraries = await this.itemRepo.getAllLibraries()
      const library = libraries.find((lib) => lib.id === filters.libraryId)
      if (!library || library.itemIds.length === 0) {
        return { items: [], totalItems: 0, hasNextPage: false }
      }
      searchResult = await this.itemRepo.findByIds(library.itemIds, filters)
    } else {
      searchResult = await this.itemRepo.search(filters)
    }

    // Enrich items with library info
    const libraryMap = await this.buildLibraryItemMap()
    const items: BrowseItemResult[] = searchResult.items.map((item) => ({
      ...item,
      libraryId: libraryMap[item.id]?.id || null,
      libraryName: libraryMap[item.id]?.name || null,
    }))

    return {
      items,
      totalItems: searchResult.totalItems,
      hasNextPage: searchResult.hasNextPage,
    }
  }

  async getAvailableTags(): Promise<TagRecord[]> {
    return this.itemRepo.getAllTags()
  }

  async getAvailableLibraries(): Promise<BrowseLibraryOption[]> {
    const libraries = await this.itemRepo.getAllLibraries()
    return libraries.map(({ itemIds, ...rest }) => rest)
  }

  private async buildLibraryItemMap(): Promise<Record<string, { id: string; name: string }>> {
    const libraries = await this.itemRepo.getAllLibraries()
    const map: Record<string, { id: string; name: string }> = {}
    for (const lib of libraries) {
      for (const itemId of lib.itemIds) {
        map[itemId] = { id: lib.id, name: lib.name }
      }
    }
    return map
  }
}
