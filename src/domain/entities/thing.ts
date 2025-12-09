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
    if (value !== this._status) {
      const transitions = statusTransitions.thingStatus as Record<string, string[]>
      const validNextStatuses = (transitions[this._status] || []) as ThingStatus[]

      if (!validNextStatuses.includes(value)) {
        throw new InvalidThingStateTransitionError(this._status, value)
      }

      this._status = value
    }
  }
}
