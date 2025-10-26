import { Library } from './library'
import { Lender } from '../lenders/lender'
import { Borrower } from '../borrower'
import { Loan } from '../loan'
import { Thing } from '../thing'
import {
  BorrowerNotInGoodStandingError,
  DueDate,
  ID,
  InvalidThingStatusToBorrowError,
  LoanStatus,
  Location,
  ThingStatus,
  ThingTitle,
} from '../../valueItems'

export class SimpleLibrary extends Library implements Lender {
  private _items: Thing[] = []
  location!: Location // PhysicalLocation in Python, but keep generic Location interface

  override get entityID(): ID {
    return this.libraryID
  }

  addItem(item: Thing): Thing {
    this._items.push(item)
    return item
  }

  get allThings(): Iterable<Thing> {
    return this._items
  }

  get items(): Iterable<Thing> {
    return this._items
  }

  get allTitles(): Iterable<ThingTitle> {
    return Library.getTitlesFromItems(this.items)
  }

  get available_titles(): Iterable<ThingTitle> {
    const availableItems = Array.from(this.items).filter((i) => i.status === ThingStatus.READY)
    return Library.getTitlesFromItems(availableItems)
  }

  get preferredReturnLocation(): Location {
    return this.location
  }

  async startBorrow(thing: Thing, borrower: Borrower): Promise<Thing> {
    /**
     *  * Hook to allow libraries to do things like get lender approval before borrowing*/
    if (thing.status !== ThingStatus.READY) {
      throw new InvalidThingStatusToBorrowError(thing.status as any)
    }
    if (!this.canBorrow(borrower)) {
      throw new BorrowerNotInGoodStandingError()
    }
    return thing
  }

  async finishBorrow(thing: Thing, borrower: Borrower, until?: DueDate | null): Promise<Loan> {
    /**
     *  * Completes the borrow process and returns the loan made
     *  */

    if (!until) {
      const now = new Date()
      const due = new Date(now)
      due.setDate(due.getDate() + this.defaultLoanTime.days)
      until = new DueDate({ date: due })
    }

    const loan = new Loan({
      loanId: ID.generate(),
      item: thing,
      borrowerId: borrower.entityID,
      dueDate: until,
      returnLocation: this.location,
      timeReturned: null,
    })
    loan.status = LoanStatus.BORROWED
    thing.status = ThingStatus.BORROWED

    this.addLoan(loan)
    return loan
  }

  async startReturn(loan: Loan): Promise<Loan> {
    loan.status = LoanStatus.RETURN_STARTED
    loan.status = LoanStatus.WAITING_ON_LENDER_ACCEPTANCE
    loan.timeReturned = new Date()
    return loan
  }

  async finishReturn(loan: Loan): Promise<Loan> {
    loan.status = LoanStatus.RETURNED
    return loan
  }
}
