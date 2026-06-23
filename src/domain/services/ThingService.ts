import { Thing, ID, BorrowCooldownError, InvalidThingStatusToBorrowError, ThingStatus } from '@/domain'
import { BorrowRequestRepository } from '@/domain/repositories'

const BORROW_REQUEST_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

export class ThingService {
  constructor(private borrowRequestRepo: BorrowRequestRepository) {}

  async requestBorrow(thing: Thing, requesterId: ID, itemPayloadId?: ID): Promise<void> {
    const itemId = itemPayloadId ?? thing.thing_id

    // Validate the thing is in a borrowable state BEFORE doing any cooldown
    // bookkeeping. Otherwise, a user who previously requested this item could
    // get a misleading "cooldown" error when the item is in a non-borrowable
    // state (e.g. already BORROWED), instead of the expected
    // "not available for borrowing" (409) error.
    if (thing.owner_id.equals(requesterId)) {
      throw new Error('Cannot request to borrow your own item')
    }
    if (thing.status !== ThingStatus.READY) {
      throw new InvalidThingStatusToBorrowError(thing.status)
    }

    // Check cooldown for this specific user-item combination
    const lastRequest = await this.borrowRequestRepo.findLastRequest(
      itemId,
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
      await this.borrowRequestRepo.recordRequest(itemId, requesterId)
    }

    // Domain entity handles state change and validation
    thing.requestBorrow(requesterId)
  }
}
