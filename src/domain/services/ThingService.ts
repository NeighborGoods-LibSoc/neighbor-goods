import { ID } from '../valueItems'
import { Thing } from '../entities/thing'

export interface IBorrowRequestRepository {
  hasActiveRequest(thingId: ID, userId: ID): Promise<boolean>
  createRequest(thingId: ID, userId: ID): Promise<void>
}

export class ThingService {
  constructor(private borrowRequestRepo: IBorrowRequestRepository) {}

  async requestBorrow(thing: Thing, userId: ID): Promise<void> {
    const hasActive = await this.borrowRequestRepo.hasActiveRequest(thing.thing_id, userId)
    if (hasActive) {
      throw new Error('You already have an active borrow request for this item')
    }

    thing.requestBorrow(userId)
    await this.borrowRequestRepo.createRequest(thing.thing_id, userId)
  }
}
