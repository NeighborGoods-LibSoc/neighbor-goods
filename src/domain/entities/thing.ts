import { Entity } from './entity'
import {
  ID,
  InvalidThingStateTransitionError,
  Location,
  Money,
  ThingStatus,
  ThingTitle,
} from '../valueItems'
import statusTransitions from '../valueItems/statusTransitions.json'

export class Thing extends Entity {
  thing_id: ID
  title: ThingTitle
  description: string | null
  owner_id: ID
  storage_location: Location
  image_urls: string[]
  purchase_cost: Money | null
  private _status: ThingStatus = ThingStatus.READY
  private _requestedToBorrowBy: ID | null = null

  constructor(params: {
    thing_id: ID
    title: ThingTitle
    description: string | null
    owner_id: ID
    storage_location: Location
    image_urls?: string[]
    purchase_cost?: Money | null
    status?: ThingStatus
    requestedToBorrowBy?: ID | null
  }) {
    super()
    this.thing_id = params.thing_id
    this.title = params.title
    this.description = params.description
    this.owner_id = params.owner_id
    this.storage_location = params.storage_location
    this.image_urls = params.image_urls ?? []
    this.purchase_cost = params.purchase_cost ?? null
    this._status = params.status ?? ThingStatus.READY
    this._requestedToBorrowBy = params.requestedToBorrowBy ?? null
  }

  get entityID(): ID {
    return this.thing_id
  }

  get status(): ThingStatus {
    return this._status
  }

  set status(value: ThingStatus) {
    if (value !== this._status) {
      const transitions = statusTransitions.thingStatus as Record<string, string[]>
      const validNextStatuses = (transitions[this._status] || []) as ThingStatus[]

      if (!validNextStatuses.includes(value)) {
        throw new InvalidThingStateTransitionError(this._status, value)
      }

      this._status = value
    }
  }

  get requestedToBorrowBy(): ID | null {
    return this._requestedToBorrowBy
  }

  isOwnedBy(userId: ID): boolean {
    return this.owner_id.equals(userId)
  }

  requestBorrow(requesterId: ID): void {
    if (this.owner_id.equals(requesterId)) {
      throw new Error('Cannot request to borrow your own item')
    }
    if (this._status !== ThingStatus.READY) {
      throw new Error('Item is not available for borrowing')
    }
    this.status = ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW
    this._requestedToBorrowBy = requesterId
  }

  approveBorrowRequest(): void {
    if (this._status !== ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
      throw new Error('No pending borrow request to approve')
    }
    this.status = ThingStatus.BORROWED
  }

  rejectBorrowRequest(): void {
    if (this._status !== ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
      throw new Error('No pending borrow request to reject')
    }
    this.status = ThingStatus.READY
    this._requestedToBorrowBy = null
  }

  reserve(): void {
    this.status = ThingStatus.RESERVED
  }

  markReady(): void {
    this.status = ThingStatus.READY
    this._requestedToBorrowBy = null
  }

  markDamaged(): void {
    this.status = ThingStatus.DAMAGED
  }
}
