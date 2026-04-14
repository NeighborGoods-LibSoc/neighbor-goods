import { ThingStatus } from '@/domain'
import { ThingRequestStatus } from '@/domain'

export const thingStatusTransitions: Record<ThingStatus, ThingStatus[]> = {
  [ThingStatus.READY]: [
    ThingStatus.BORROWED,
    ThingStatus.RESERVED,
    ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW,
  ],
  [ThingStatus.BORROWED]: [ThingStatus.READY, ThingStatus.RESERVED, ThingStatus.DAMAGED],
  [ThingStatus.RESERVED]: [ThingStatus.READY, ThingStatus.BORROWED],
  [ThingStatus.DAMAGED]: [ThingStatus.READY],
  [ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW]: [
    ThingStatus.READY,
    ThingStatus.RESERVED,
    ThingStatus.BORROWED,
  ],
}

export const requestStatusTransitions: Record<ThingRequestStatus, ThingRequestStatus[]> = {
  [ThingRequestStatus.OPEN]: [ThingRequestStatus.FULFILLED, ThingRequestStatus.CLOSED],
  [ThingRequestStatus.FULFILLED]: [],
  [ThingRequestStatus.CLOSED]: [ThingRequestStatus.OPEN],
}
