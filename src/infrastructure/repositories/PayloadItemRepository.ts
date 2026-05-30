import { Payload, Where } from 'payload'
import type {
  ItemRepository,
  ItemSearchFilters,
  ItemSearchResult,
  ItemRecord,
  TagRecord,
  LibraryRecord,
} from '@/domain/repositories'

export class PayloadItemRepository implements ItemRepository {
  constructor(private payload: Payload) {}

  async search(filters: ItemSearchFilters): Promise<ItemSearchResult> {
    const where = this.buildWhereClause(filters)

    const result = await this.payload.find({
      collection: 'items',
      where,
      limit: filters.limit,
      page: filters.page,
      depth: 1,
      sort: '-createdAt',
    })

    return {
      items: result.docs.map((doc: any) => this.mapDocToItemRecord(doc)),
      totalItems: result.totalDocs,
      hasNextPage: result.hasNextPage,
    }
  }

  async findByIds(ids: string[], filters: ItemSearchFilters): Promise<ItemSearchResult> {
    const where = this.buildWhereClause(filters)
    const existingAnd = where.and || []
    const constrainedWhere: Where = {
      and: [...existingAnd, { id: { in: ids.join(',') } }],
    }

    const result = await this.payload.find({
      collection: 'items',
      where: constrainedWhere,
      limit: filters.limit,
      page: filters.page,
      depth: 1,
      sort: '-createdAt',
    })

    return {
      items: result.docs.map((doc: any) => this.mapDocToItemRecord(doc)),
      totalItems: result.totalDocs,
      hasNextPage: result.hasNextPage,
    }
  }

  async getAllTags(): Promise<TagRecord[]> {
    const result = await this.payload.find({
      collection: 'tags',
      limit: 100,
    })

    return result.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      color: doc.color || null,
    }))
  }

  async getAllLibraries(): Promise<LibraryRecord[]> {
    const result = await this.payload.find({
      collection: 'distributedLibraries',
      limit: 100,
      depth: 0,
    })

    return result.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      itemIds: (doc.items || []).map((item: any) =>
        typeof item === 'string' ? item : item.id,
      ),
      area: doc.area
        ? {
            center_point: doc.area.center_point
              ? {
                  city: doc.area.center_point.city || null,
                  state: doc.area.center_point.state || null,
                }
              : null,
            radius_kilometers: doc.area.radius_kilometers || null,
          }
        : null,
    }))
  }

  private buildWhereClause(filters: ItemSearchFilters): Where {
    const conditions: Where[] = []

    if (filters.searchQuery?.trim()) {
      const searchTerm = filters.searchQuery.trim()
      conditions.push({
        or: [
          { name: { like: searchTerm } },
          { description: { like: searchTerm } },
        ],
      })
    }

    if (filters.status) {
      conditions.push({ status: { equals: filters.status } })
    }

    if (filters.tagIds && filters.tagIds.length > 0) {
      for (const tagId of filters.tagIds) {
        conditions.push({ tags: { in: tagId } })
      }
    }

    if (conditions.length === 0) return {}
    if (conditions.length === 1) return conditions[0] as Where
    return { and: conditions }
  }

  private mapDocToItemRecord(doc: any): ItemRecord {
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description || null,
      status: doc.status,
      tags: (doc.tags || []).map((tag: any) => {
        if (typeof tag === 'string') return { id: tag, name: tag }
        return { id: tag.id, name: tag.name, color: tag.color || null }
      }),
      offeredBy: doc.offeredBy
        ? typeof doc.offeredBy === 'string'
          ? null
          : { id: doc.offeredBy.id, name: doc.offeredBy.name }
        : null,
      primaryImage: doc.primaryImage
        ? typeof doc.primaryImage === 'string'
          ? null
          : { url: doc.primaryImage.url, filename: doc.primaryImage.filename }
        : null,
      borrowingTime: doc.borrowingTime || null,
    }
  }
}
