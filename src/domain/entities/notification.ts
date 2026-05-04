import { Entity } from './entity'
import { ID, NotificationType } from '@/domain'

export class Notification extends Entity {
  readonly notificationID: ID
  readonly recipient: ID
  readonly type: NotificationType
  readonly message: string
  readonly itemId: ID
  readonly triggeredBy: ID
  read: boolean
  readonly actionURL: string

  constructor(params: {
    notificationID?: ID
    recipient: ID
    type: NotificationType
    message: string
    itemId: ID
    triggeredBy: ID
    read?: boolean
    actionURL: string
  }) {
    super()
    this.notificationID = params.notificationID ?? ID.generate()
    this.recipient = params.recipient
    this.type = params.type
    this.message = params.message
    this.itemId = params.itemId
    this.triggeredBy = params.triggeredBy
    this.read = params.read ?? false
    this.actionURL = params.actionURL
  }

  get entityID(): ID {
    return this.notificationID
  }

  markAsRead(): void {
    this.read = true
  }
}
