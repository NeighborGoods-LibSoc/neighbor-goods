import { Entity } from "../entity";
import { ID, FeeStatus, Money } from "../../valueItems";

export class LibraryFee extends Entity {
  libraryFeeID: ID;
  libraryID: ID;
  amount: Money;
  private _status: FeeStatus = FeeStatus.OUTSTANDING;
  chargedForID: ID;

  constructor(params: {
    libraryFeeID: ID;
    libraryID: ID;
    amount: Money;
    chargedForID: ID;
  }) {
    super();
    this.libraryFeeID = params.libraryFeeID;
    this.libraryID = params.libraryID;
    this.amount = params.amount;
    this.chargedForID = params.chargedForID;
  }

  get status(): FeeStatus {
    return this._status;
  }
  set status(value: FeeStatus) {
    this._status = value;
  }

  get entityID(): ID {
    return this.libraryFeeID;
  }
}
