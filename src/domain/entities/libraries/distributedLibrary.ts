import { Library } from "./library";
import { Borrower } from "../borrower";
import { Loan } from "../loan";
import { Thing } from "../thing";
import { Lender } from "../lenders/lender";
import {
  ID,
  DueDate,
  LoanStatus,
  PhysicalArea,
  ThingStatus,
} from "../../valueItems";

export class DistributedLibrary extends Library {
  area!: PhysicalArea
  private _lenders: Lender[] = []

  override get entityID(): ID {
    return this.libraryID
  }

  get allThings(): Iterable<Thing> {
    const items: Thing[] = []
    for (const lender of this._lenders) {
      for (const thing of lender.items) items.push(thing)
    }
    return items
  }

  getOwnerOfItem(item: Thing): Lender {
    for (const lender of this._lenders) {
      for (const lender_item of lender.items) {
        if (item.entityID && lender_item.entityID && item.entityID.equals(lender_item.entityID)) {
          return lender
        }
      }
    }
    throw new Error(`Cannot find an owner for ${item.title.name}`)
  }

  override async startBorrow(thing: Thing, borrower: Borrower): Promise<Thing> {
    return thing;
  }

  override async finishBorrow(thing: Thing, borrower: Borrower, until?: DueDate | null): Promise<Loan> {
    if (thing.status !== ThingStatus.READY) {
      throw new Error(String(thing.status))
    }
    if (!this.canBorrow(borrower)) {
      throw new Error('BorrowerNotInGoodStandingError')
    }

    const lender = this.getOwnerOfItem(thing)
    if (!lender) throw new Error(`Cannot find owner of item ${thing.entityID}`)

    if (!until) {
      const now = new Date()
      const due = new Date(now)
      due.setDate(due.getDate() + this.defaultLoanTime.days)
      until = new DueDate({ date: due })
    }

    thing.status = ThingStatus.BORROWED

    const loan = new Loan({
      loan_id: ID.generate(),
      item: thing,
      borrower_id: borrower.entityID,
      due_date: until,
      return_location: lender.preferredReturnLocation,
      time_returned: null,
    })
    loan.status = LoanStatus.BORROWED
    return loan
  }

  override async finishLibraryReturn(loan: Loan, borrower: Borrower): Promise<Loan> {
    const owner = this.getOwnerOfItem(loan.item)
    const from_owner = await owner.finishReturn(loan)
    return super.finishLibraryReturn(from_owner, borrower)
  }

  override async startReturn(loan: Loan): Promise<Loan> {
    const owner = this.getOwnerOfItem(loan.item)
    const updated = await owner.startReturn(loan)

    loan.timeReturned = new Date()
    if (updated.status !== LoanStatus.WAITING_ON_LENDER_ACCEPTANCE) {
      updated.status = LoanStatus.WAITING_ON_LENDER_ACCEPTANCE
    }
    return updated
  }

  addLender(lender: Lender): Lender {
    this._lenders.push(lender)
    return lender
  }
}
