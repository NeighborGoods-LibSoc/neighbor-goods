import { Payload } from 'payload'
import { Notification } from '@/domain/entities/notification'
import { NotificationRepository } from '@/domain/repositories/NotificationRepository'

export class PayloadNotificationRepository implements NotificationRepository {
  constructor(private payload: Payload) {}

  async create(notification: Notification): Promise<void> {
    await this.payload.create({
      collection: 'notifications',
      data: {
        recipient: notification.recipient.toString(),
        type: notification.type,
        message: notification.message,
        item: notification.itemId.toString(),
        triggeredBy: notification.triggeredBy.toString(),
        read: notification.read,
        actionURL: notification.actionURL,
      },
    })
  }
}
