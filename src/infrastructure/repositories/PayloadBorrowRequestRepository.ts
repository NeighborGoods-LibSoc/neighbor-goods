import { Payload } from 'payload'
import { ID, BorrowRequest, BorrowRequestRepository } from '@/domain'

export class PayloadBorrowRequestRepository implements BorrowRequestRepository {
  constructor(private payload: Payload) {}

  async findLastRequest(itemId: ID, requesterId: ID): Promise<BorrowRequest | null> {
    const result = await this.payload.find({
      collection: 'borrow-requests',
      where: {
        and: [
          { item: { equals: itemId.toString() } },
          { requestedBy: { equals: requesterId.toString() } },
        ],
      },
      limit: 1,
    })

    const doc = result.docs[0]
    if (!doc) return null

    return {
      id: doc.id,
      itemId: ID.parse(typeof doc.item === 'object' ? doc.item.id : doc.item),
      requesterId: ID.parse(
        typeof doc.requestedBy === 'object' ? doc.requestedBy.id : doc.requestedBy,
      ),
      requestedAt: new Date(doc.requestedAt),
    }
  }

  async recordRequest(itemId: ID, requesterId: ID): Promise<void> {
    await this.payload.create({
      collection: 'borrow-requests',
      data: {
        item: itemId.toString(),
        requestedBy: requesterId.toString(),
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
