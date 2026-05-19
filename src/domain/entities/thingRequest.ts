import { Entity } from './entity'
import {
  ID,
  InvalidThingRequestStateTransitionError,
  ThingRequestStatus,
  requestStatusTransitions,
} from '@/domain'
import { requestStatusTransitions } from '@/domain'

export class ThingRequest extends Entity {
  thingRequestID: ID
  name: string
  description: string | null
  private _status: ThingRequestStatus
  private _requestedBy: ID

  constructor(params: {
    thingRequestID: ID
    name: string
    description?: string | null
    status?: ThingRequestStatus
    requestedBy: ID
  }) {
    super()
    this.thingRequestID = params.thingRequestID
    this.name = params.name
    this.description = params.description ?? null
    this._status = params.status ?? ThingRequestStatus.OPEN
    this._requestedBy = params.requestedBy
  }

  get entityID(): ID {
    return this.thingRequestID
  }

  get status(): ThingRequestStatus {
    return this._status
  }

  set status(value: ThingRequestStatus) {
    if (value !== this._status) {
      const validNextStatuses = (requestStatusTransitions[this._status] || []) as ThingRequestStatus[]

      if (!validNextStatuses.includes(value)) {
        throw new InvalidThingRequestStateTransitionError(this._status, value)
      }

      this._status = value
    }
  }

  get requestedBy(): ID {
    return this._requestedBy
  }

  fulfill(): void {
    this.status = ThingRequestStatus.FULFILLED
  }

  close(): void {
    this.status = ThingRequestStatus.CLOSED
  }

  reopen(): void {
    this.status = ThingRequestStatus.OPEN
  }
}
