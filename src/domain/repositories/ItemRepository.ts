import { ThingStatus } from '@/domain'

export interface ItemSearchFilters {
  searchQuery?: string
  status?: ThingStatus | string
  tagIds?: string[]
  libraryId?: string
  page: number
  limit: number
}

export interface ItemRecord {
  id: string
  name: string
  description?: string | null
  status: string
  tags: { id: string; name: string; color?: string | null }[]
  offeredBy?: { id: string; name?: string } | null
  primaryImage?: { url?: string; filename?: string } | null
  borrowingTime?: number | null
}

export interface ItemSearchResult {
  items: ItemRecord[]
  totalItems: number
  hasNextPage: boolean
}

export interface TagRecord {
  id: string
  name: string
  color?: string | null
}

export interface LibraryRecord {
  id: string
  name: string
  itemIds: string[]
  area?: {
    center_point?: {
      city?: string | null
      state?: string | null
    } | null
    radius_kilometers?: number | null
  } | null
}

export interface ItemRepository {
  search(filters: ItemSearchFilters): Promise<ItemSearchResult>
  findByIds(ids: string[], filters: ItemSearchFilters): Promise<ItemSearchResult>
  getAllTags(): Promise<TagRecord[]>
  getAllLibraries(): Promise<LibraryRecord[]>
}
