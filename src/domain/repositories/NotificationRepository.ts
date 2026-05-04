import { Notification } from '@/domain'

export interface NotificationRepository {
  create(notification: Notification): Promise<void>
}
