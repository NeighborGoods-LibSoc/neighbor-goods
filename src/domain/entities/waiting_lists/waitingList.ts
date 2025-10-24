import { Entity } from "../entity";
import { Borrower } from "../borrower";
import { Thing } from "../thing";
import { ID, ReservationStatus, ThingStatus, WaitingListType } from '../../valueItems'

export abstract class WaitingList extends Entity {
  waitingListId: ID;
  item: Thing;
  currentReservation: Reservation | null = null;
  expiredReservations: Reservation[] = [];

  constructor(params: { waiting_list_id?: ID; item: Thing }) {
    super();
    this.waitingListId = params.waiting_list_id ?? ID.generate();
    this.item = params.item;
  }

  get entityID(): ID {
    return this.waitingListId;
  }

  abstract add(borrower: Borrower): this;
  abstract findNextBorrower(): Borrower | null;
  abstract isOnList(borrower: Borrower): boolean;
  abstract processReservationExpired(reservation: Reservation): this;
  abstract cancel(borrower: Borrower): this;
  abstract getReservationTime(): { days: number };
  abstract waitingListType: WaitingListType;

  clearCurrentReservation(): void {
    this.currentReservation = null;
  }

  reserveItemForNextBorrower(): Reservation {
    if (this.currentReservation) {
      throw new Error(
        "This item already has a reservation, please remove that first",
      );
    }
    const next_borrower = this.findNextBorrower();
    if (!next_borrower)
      throw new Error("No borrower is waiting for this item!");

    const days = this.getReservationTime().days;
    const good_until = new Date();
    good_until.setDate(good_until.getDate() + days);

    this.item.status = ThingStatus.RESERVED;

    const res = new Reservation({
      reservation_id: ID.generate(),
      holder: next_borrower,
      item: this.item,
      good_until,
      status: ReservationStatus.ASSIGNED,
    });

    this.cancel(next_borrower);
    this.currentReservation = res;
    return res;
  }
}

export class Reservation extends Entity {
  reservation_id: ID;
  holder: Borrower;
  item: Thing;
  good_until: Date;
  private _status: ReservationStatus;

  constructor(params: {
    reservation_id: ID;
    holder: Borrower;
    item: Thing;
    good_until: Date;
    status: ReservationStatus;
  }) {
    super();
    this.reservation_id = params.reservation_id;
    this.holder = params.holder;
    this.item = params.item;
    this.good_until = params.good_until;
    this._status = params.status;
  }

  get entityID(): ID {
    return this.reservation_id;
  }
  get status(): ReservationStatus {
    return this._status;
  }
  set status(status: ReservationStatus) {
    let valid: ReservationStatus[] = [];
    if (this.status === ReservationStatus.ASSIGNED)
      valid = [ReservationStatus.BORROWER_NOTIFIED];
    else if (this.status === ReservationStatus.BORROWER_NOTIFIED)
      valid = [ReservationStatus.EXPIRED, ReservationStatus.BORROWED];
    else if (this.status === ReservationStatus.BORROWED) valid = [];
    else if (this.status === ReservationStatus.EXPIRED) valid = [];
    else if (this.status === ReservationStatus.CANCELLED) valid = [];

    if (!valid.includes(status)) {
      throw new Error("InvalidReservationStateTransitionError");
    }
    this._status = status;
  }
}
