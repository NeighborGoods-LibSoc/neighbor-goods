import { Payload } from 'payload'
import { Notification } from '@/domain/entities/notification'
import { NotificationRepository } from '@/domain/repositories/NotificationRepository'

export class PayloadNotificationRepository implements NotificationRepository {
  constructor(private payload: Payload) {}

  private async findUserMongoId(uuid: string): Promise<string | null> {
    const result = await this.payload.find({
      collection: 'users',
      where: { user_id: { equals: uuid } },
      limit: 1,
    })
    return result.docs[0]?.id ?? null
  }

  private async findItemMongoId(uuid: string): Promise<string | null> {
    const result = await this.payload.find({
      collection: 'items',
      where: { item_id: { equals: uuid } },
      limit: 1,
    })
    return result.docs[0]?.id ?? null
  }

  async create(notification: Notification): Promise<void> {
    const recipientMongoId = await this.findUserMongoId(notification.recipient.toString())
    const triggeredByMongoId = await this.findUserMongoId(notification.triggeredBy.toString())
    const itemMongoId = await this.findItemMongoId(notification.itemId.toString())

    if (!recipientMongoId) {
      throw new Error(`Could not find user with UUID ${notification.recipient.toString()}`)
    }

    await this.payload.create({
      collection: 'notifications',
      data: {
        recipient: recipientMongoId,
        type: notification.type,
        message: notification.message,
        item: itemMongoId ?? undefined,
        triggeredBy: triggeredByMongoId ?? undefined,
        read: notification.read,
        actionURL: notification.actionURL,
      },
    })
  }
}
