import { Payload } from 'payload'
import { ID } from '../../domain/valueItems'
import { IBorrowRequestRepository } from '../../domain/services/ThingService'

export class PayloadBorrowRequestRepository implements IBorrowRequestRepository {
  constructor(private payload: Payload) {}

  async hasActiveRequest(thingId: ID, userId: ID): Promise<boolean> {
    const { totalDocs } = await this.payload.find({
      collection: 'borrow-requests',
      where: {
        and: [
          {
            item: {
              equals: thingId.toString(),
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
    await this.payload.create({
      collection: 'borrow-requests',
      data: {
        item: thingId.toString(),
        requestedBy: userId.toString(),
        requestedAt: new Date().toISOString(),
      },
    })
  }
}
