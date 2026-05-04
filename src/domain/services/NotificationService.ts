import { Notification } from '@/domain'
import { ID } from '@/domain'
import { NotificationType } from '@/domain'
import { ThingStatus } from '@/domain'
import { NotificationRepository } from '@/domain/repositories'

export interface PersonLookup {
  getPersonName(personId: ID): Promise<string>
}

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private personLookup: PersonLookup,
  ) {}

  async notifyOnStatusChange(params: {
    itemId: ID
    itemName: string
    previousStatus: ThingStatus
    newStatus: ThingStatus
    ownerId: ID
    requesterId: ID | null
  }): Promise<void> {
    const { itemId, itemName, previousStatus, newStatus, ownerId, requesterId } = params

    // Notify owner when someone requests to borrow
    if (
      newStatus === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW &&
      previousStatus !== ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW
    ) {
      if (requesterId) {
        const requesterName = await this.personLookup.getPersonName(requesterId)
        await this.notificationRepo.create(
          new Notification({
            recipient: ownerId,
            type: NotificationType.BORROW_REQUEST,
            message: `${requesterName} has requested to borrow "${itemName}"`,
            itemId,
            triggeredBy: requesterId,
            actionURL: `/items/${itemId.toString()}`,
          }),
        )
      }
    }

    // Notify requester when owner approves (BORROWED)
    if (
      newStatus === ThingStatus.BORROWED &&
      previousStatus === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW
    ) {
      if (requesterId) {
        await this.notificationRepo.create(
          new Notification({
            recipient: requesterId,
            type: NotificationType.BORROW_APPROVED,
            message: `Your request to borrow "${itemName}" has been approved!`,
            itemId,
            triggeredBy: ownerId,
            actionURL: `/items/${itemId.toString()}`,
          }),
        )
      }
    }

    // Notify requester when owner rejects (back to READY from WAITING)
    if (
      newStatus === ThingStatus.READY &&
      previousStatus === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW
    ) {
      if (requesterId) {
        await this.notificationRepo.create(
          new Notification({
            recipient: requesterId,
            type: NotificationType.BORROW_REJECTED,
            message: `Your request to borrow "${itemName}" was declined`,
            itemId,
            triggeredBy: ownerId,
            actionURL: `/items/${itemId.toString()}`,
          }),
        )
      }
    }

    // Notify requester when owner reserves the item for them
    if (
      newStatus === ThingStatus.RESERVED &&
      previousStatus === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW
    ) {
      if (requesterId) {
        await this.notificationRepo.create(
          new Notification({
            recipient: requesterId,
            type: NotificationType.BORROW_APPROVED,
            message: `"${itemName}" has been reserved for you — please arrange pickup!`,
            itemId,
            triggeredBy: ownerId,
            actionURL: `/items/${itemId.toString()}`,
          }),
        )
      }
    }
  }
}
