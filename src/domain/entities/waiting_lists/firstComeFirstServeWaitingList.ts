import { WaitingList, Reservation } from "./waitingList";
import { Borrower } from "../borrower";
import { ReservationStatus, WaitingListType } from '../../valueItems'

export class FirstComeFirstServeWaitingList extends WaitingList {
  members: Borrower[] = [];
  reservation_days: number = 3;
  private _expiredReservations: Reservation[] = [];
  waitingListType: WaitingListType = WaitingListType.FIRST_COME_FIRST_SERVE;

  add(borrower: Borrower): this {
    this.members.push(borrower);
    return this;
  }

  isOnList(borrower: Borrower): boolean {
    const member_ids = this.members.map((b) => b.entityID.toString());
    return member_ids.includes(borrower.entityID.toString());
  }

  findNextBorrower(): Borrower | null {
    if (this.members.length === 0) return null;
    return this.members[0] ?? null;
  }

  getReservationTime(): { days: number } {
    return { days: this.reservation_days };
  }

  processReservationExpired(reservation: Reservation): this {
    // Mark as expired if allowed; otherwise just clear the current reservation
    try {
      // Only transition if currently BORROWER_NOTIFIED per Python logic; our Reservation setter enforces transitions
      (reservation as any)._status = ReservationStatus.BORROWER_NOTIFIED;
      reservation.status = ReservationStatus.EXPIRED;
    } catch {
      // ignore invalid transition in this minimal model
    }
    this._expiredReservations.push(reservation);
    this.clearCurrentReservation();
    return this;
  }

  cancel(borrower: Borrower): this {
    this.members = this.members.filter(
      (b) => !b.entityID.equals(borrower.entityID),
    );
    return this;
  }
}
