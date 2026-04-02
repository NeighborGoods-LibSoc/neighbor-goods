import { Payload } from 'payload'
import { ID } from '../../domain/valueItems'
import { IBorrowRequestRepository } from '../../domain/services/ThingService'

export class PayloadBorrowRequestRepository implements IBorrowRequestRepository {
  constructor(private payload: Payload) {}

  async hasActiveRequest(thingId: ID, userId: ID): Promise<boolean> {
    // We need the internal Payload ID for the relationship field
    const { docs: itemDocs } = await this.payload.find({
      collection: 'items',
      where: {
        item_id: {
          equals: thingId.toString(),
        },
      },
      limit: 1,
    })

    const internalId = itemDocs.length > 0 ? itemDocs[0].id : thingId.toString()

    const { totalDocs } = await this.payload.find({
      collection: 'borrow-requests',
      where: {
        and: [
          {
            item: {
              equals: internalId,
            },
          },
          {
            requestedBy: {
              equals: userId.toString(),
            },
          },
          {
            requestedAt: {
              // Within the last hour
              greater_than: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            },
          },
        ],
      },
    })

    return totalDocs > 0
  }

  async createRequest(thingId: ID, userId: ID): Promise<void> {
    // We need the internal Payload ID for the relationship field
    const { docs } = await this.payload.find({
      collection: 'items',
      where: {
        item_id: {
          equals: thingId.toString(),
        },
      },
      limit: 1,
    })

    const internalId = docs.length > 0 ? docs[0].id : thingId.toString()

    await this.payload.create({
      collection: 'borrow-requests',
      data: {
        item: internalId,
        requestedBy: userId.toString(),
        requestedAt: new Date().toISOString(),
      },
    })
  }
}
