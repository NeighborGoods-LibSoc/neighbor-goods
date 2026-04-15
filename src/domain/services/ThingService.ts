import { Thing } from '../entities/thing'
import { ID, BorrowCooldownError } from '../valueItems'
import { BorrowRequestRepository } from '../repositories/BorrowRequestRepository'

const BORROW_REQUEST_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

export class ThingService {
  constructor(private borrowRequestRepo: BorrowRequestRepository) {}

  async requestBorrow(thing: Thing, requesterId: ID): Promise<void> {
    // Check cooldown for this specific user-item combination
    const lastRequest = await this.borrowRequestRepo.findLastRequest(
      thing.thing_id,
      requesterId,
    )

    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - lastRequest.requestedAt.getTime()

      if (timeSinceLastRequest < BORROW_REQUEST_COOLDOWN_MS) {
        const minutesRemaining = Math.ceil(
          (BORROW_REQUEST_COOLDOWN_MS - timeSinceLastRequest) / 60000,
        )
        throw new BorrowCooldownError(minutesRemaining)
      }

      // Update existing request timestamp
      await this.borrowRequestRepo.updateRequestTime(lastRequest.id)
    } else {
      // Create new request record
      await this.borrowRequestRepo.recordRequest(thing.thing_id, requesterId)
    }

    // Domain entity handles state change and validation
    thing.requestBorrow(requesterId)
  }
}
