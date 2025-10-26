import { Entity } from "./entity";
import { Thing } from "./thing";
import { ID, DueDate, LoanStatus, Location } from "../valueItems";

export class Loan extends Entity {
  loanID: ID;
  item: Thing;
  dueDate: DueDate;
  borrowerID: ID;
  private _status: LoanStatus = LoanStatus.RETURNED;
  returnLocation: Location | null;
  timeReturned: Date | null;

  constructor(params: {
    loanId: ID;
    item: Thing;
    dueDate: DueDate;
    borrowerId: ID;
    returnLocation: Location;
    timeReturned: Date | null;
  }) {
    super();
    this.loanID = params.loanId;
    this.item = params.item;
    this.dueDate = params.dueDate;
    this.borrowerID = params.borrowerId;
    this.returnLocation = params.returnLocation;
    this.timeReturned = params.timeReturned;
  }

  get lenderId(): ID {
    return this.item.owner_id;
  }

  get entityID(): ID {
    return this.loanID;
  }

  get active(): boolean {
    return this._status === LoanStatus.BORROWED;
  }

  get status(): LoanStatus {
    if (
      this.dueDate &&
      !this.dueDate.isAfterNow() &&
      this._status === LoanStatus.BORROWED
    ) {
      this._status = LoanStatus.OVERDUE;
    }
    return this._status;
  }

  set status(value: LoanStatus) {
    let valid_new_statuses: LoanStatus[] = [];
    switch (this._status) {
      case LoanStatus.RETURNED:
        valid_new_statuses = [LoanStatus.BORROWED];
        break;
      case LoanStatus.BORROWED:
        valid_new_statuses = [LoanStatus.RETURN_STARTED, LoanStatus.OVERDUE];
        break;
      case LoanStatus.OVERDUE:
        valid_new_statuses = [LoanStatus.RETURN_STARTED];
        break;
      case LoanStatus.RETURN_STARTED:
        valid_new_statuses = [
          LoanStatus.WAITING_ON_LENDER_ACCEPTANCE,
          LoanStatus.RETURNED,
          LoanStatus.RETURNED_DAMAGED,
        ];
        break;
      case LoanStatus.WAITING_ON_LENDER_ACCEPTANCE:
        valid_new_statuses = [
          LoanStatus.RETURNED,
          LoanStatus.RETURNED_DAMAGED,
          LoanStatus.OVERDUE,
        ];
        break;
      case LoanStatus.RETURNED_DAMAGED:
        valid_new_statuses = [];
        break;
    }

    if (!valid_new_statuses.includes(value)) {
      throw new Error(
        `Cannot change loan status from '${this._status}' to '${value}'.`,
      );
    }
    this._status = value;
  }

  get isPermanentLoan(): boolean {
    /**
     *  * Represents if this is a loan that doesn't require a return.
     *  * It is a gift, but we expect people to return it to the library if they don't need it
     *  * From a legal standpoint, it remains the property of the library
     *  */
    return this.dueDate.date === null;
  }
}
