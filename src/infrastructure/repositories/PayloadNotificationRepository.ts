import { Payload } from 'payload'
import { Notification } from '@/domain/entities/notification'
import { NotificationRepository } from '@/domain/repositories/NotificationRepository'

export class PayloadNotificationRepository implements NotificationRepository {
  constructor(private payload: Payload) {}

  private async findUserId(uuid: string): Promise<string | null> {
    const result = await this.payload.find({
      collection: 'users',
      where: { user_id: { equals: uuid } },
      limit: 1,
    })
    return result.docs[0]?.id ?? null
  }

  private async findItemId(uuid: string): Promise<string | null> {
    const result = await this.payload.find({
      collection: 'items',
      where: { item_id: { equals: uuid } },
      limit: 1,
    })
    return result.docs[0]?.id ?? null
  }

  async create(notification: Notification): Promise<void> {
    const recipientId = await this.findUserId(notification.recipient.toString())
    const triggeredById = await this.findUserId(notification.triggeredBy.toString())
    const itemId = await this.findItemId(notification.itemId.toString())

    if (!recipientId) {
      throw new Error(`Could not find user with UUID ${notification.recipient.toString()}`)
    }

    await this.payload.create({
      collection: 'notifications',
      overrideAccess: true,
      data: {
        recipient: recipientId,
        type: notification.type,
        message: notification.message,
        item: itemId ?? undefined,
        triggeredBy: triggeredById ?? undefined,
        read: notification.read,
        actionURL: notification.actionURL,
      },
    })
  }
}
