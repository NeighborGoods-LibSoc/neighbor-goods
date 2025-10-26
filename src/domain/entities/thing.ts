import { Entity } from './entity'
import {
  ID,
  InvalidThingStateTransitionError,
  Location,
  Money,
  ThingStatus,
  ThingTitle,
} from '../valueItems'

export class Thing extends Entity {
  thing_id: ID
  title: ThingTitle
  description: string | null
  owner_id: ID
  storage_location: Location
  image_urls: string[]
  purchase_cost: Money | null
  private _status: ThingStatus = ThingStatus.READY

  constructor(params: {
    thing_id: ID
    title: ThingTitle
    description: string | null
    owner_id: ID
    storage_location: Location
    image_urls?: string[]
    purchase_cost?: Money | null
  }) {
    super()
    this.thing_id = params.thing_id
    this.title = params.title
    this.description = params.description
    this.owner_id = params.owner_id
    this.storage_location = params.storage_location
    this.image_urls = params.image_urls ?? []
    this.purchase_cost = params.purchase_cost ?? null
  }

  get entityID(): ID {
    return this.thing_id
  }

  get status(): ThingStatus {
    return this._status
  }

  set status(value: ThingStatus) {
    let valid_next_statuses: ThingStatus[] = []

    if (value !== this._status) {
      if (this._status === ThingStatus.READY) {
        valid_next_statuses = [
          ThingStatus.BORROWED,
          ThingStatus.RESERVED,
          ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW,
        ]
      } else if (this._status === ThingStatus.BORROWED) {
        valid_next_statuses = [ThingStatus.READY, ThingStatus.RESERVED, ThingStatus.DAMAGED]
      } else if (this._status === ThingStatus.RESERVED) {
        valid_next_statuses = [ThingStatus.READY, ThingStatus.BORROWED]
      } else if (this._status === ThingStatus.DAMAGED) {
        valid_next_statuses = []
      } else if (this._status === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
        valid_next_statuses = [ThingStatus.READY, ThingStatus.BORROWED]
      }

      if (!valid_next_statuses.includes(value)) {
        throw new InvalidThingStateTransitionError(this._status, value)
      }

      this._status = value
    }
  }
}
