import { Payload } from 'payload'
import { ID, BorrowRequest, BorrowRequestRepository } from '@/domain'

export class PayloadBorrowRequestRepository implements BorrowRequestRepository {
  constructor(private payload: Payload) {}

  async findLastRequest(itemId: ID, requesterId: ID): Promise<BorrowRequest | null> {
    // Resolve domain UUIDs to Payload document ids for relationship field queries
    const itemResult = await this.payload.find({
      collection: 'items',
      where: { item_id: { equals: itemId.toString() } },
      limit: 1,
    })
    const itemDocId = itemResult.docs[0]?.id
    if (!itemDocId) return null

    const userResult = await this.payload.find({
      collection: 'users',
      where: { user_id: { equals: requesterId.toString() } },
      limit: 1,
    })
    const userDocId = userResult.docs[0]?.id
    if (!userDocId) return null

    const result = await this.payload.find({
      collection: 'borrow-requests',
      where: {
        and: [
          { item: { equals: itemDocId } },
          { requestedBy: { equals: userDocId } },
        ],
      },
      limit: 1,
    })

    const doc = result.docs[0]
    if (!doc) return null

    return {
      id: doc.id,
      itemId,
      requesterId,
      requestedAt: new Date(doc.requestedAt),
    }
  }

  async recordRequest(itemId: ID, requesterId: ID): Promise<void> {
    // Relationship fields require Payload document ids, not domain UUIDs.
    // Look up the Payload document id for each domain UUID.
    const itemResult = await this.payload.find({
      collection: 'items',
      where: { item_id: { equals: itemId.toString() } },
      limit: 1,
    })
    const itemDocId = itemResult.docs[0]?.id
    if (!itemDocId) throw new Error(`Item not found for domain id: ${itemId.toString()}`)

    const userResult = await this.payload.find({
      collection: 'users',
      where: { user_id: { equals: requesterId.toString() } },
      limit: 1,
    })
    const userDocId = userResult.docs[0]?.id
    if (!userDocId) throw new Error(`User not found for domain id: ${requesterId.toString()}`)

    await this.payload.create({
      collection: 'borrow-requests',
      data: {
        item: itemDocId,
        requestedBy: userDocId,
        requestedAt: new Date().toISOString(),
      },
    })
  }

  async updateRequestTime(requestId: string): Promise<void> {
    await this.payload.update({
      collection: 'borrow-requests',
      id: requestId,
      data: {
        requestedAt: new Date().toISOString(),
      },
    })
  }
}
