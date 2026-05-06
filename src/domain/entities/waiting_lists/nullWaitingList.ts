import { WaitingList, Reservation } from './waitingList'
import { WaitingListType } from '../../valueItems/waitingListTypes'
import { Borrower } from '../borrower'

export class NullWaitingList extends WaitingList {
  override waitingListType: WaitingListType = WaitingListType.NONE
  add(_: Borrower): this {
    return this
  }
  findNextBorrower(): Borrower | null {
    return null
  }
  isOnList(_: Borrower): boolean {
    return false
  }
  processReservationExpired(_: Reservation): this {
    return this
  }
  cancel(_: Borrower): this {
    return this
  }
  getReservationTime(): { days: number } {
    return { days: 0 }
  }
}
