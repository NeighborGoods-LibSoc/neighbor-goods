import { Entity } from '../entity'
import { Borrower } from '../borrower'
import { LibraryFee } from './libraryFee'
import { Loan } from '../loan'
import { MOPServer } from '../mopServer'
import { Person } from '../people/person'
import { Thing } from '../thing'
import { WaitingList } from '../waiting_lists/waitingList'
import { MoneyFactory, WaitingListFactory } from '../../factories'
import {
  DueDate,
  FeeSchedule,
  FeeStatus,
  ID,
  LoanStatus,
  Money,
  ThingStatus,
  ThingTitle,
  WaitingListType,
} from '../../valueItems'

export abstract class Library extends Entity {
  libraryID: ID
  name: string
  administrators: Person[]
  waitingListType: WaitingListType
  waitingListsByItemId: Map<string, WaitingList> = new Map()
  maxFinesBeforeSuspension: Money
  feeSchedule: FeeSchedule
  moneyFactory: MoneyFactory = new MoneyFactory()
  defaultLoanTime: { days: number }
  mopServer: MOPServer
  publicURL?: string | null

  protected _borrowers: Borrower[] = []
  protected _loans: Loan[] = []

  constructor(params: {
    libraryID: ID
    name: string
    administrators: Person[]
    waitingListType: WaitingListType
    maxFinesBeforeSuspension: Money
    feeSchedule: FeeSchedule
    defaultLoanTime: { days: number }
    mopServer: MOPServer
    publicURL?: string | null
  }) {
    super()
    this.libraryID = params.libraryID
    this.name = params.name
    this.administrators = params.administrators
    this.waitingListType = params.waitingListType
    this.maxFinesBeforeSuspension = params.maxFinesBeforeSuspension
    this.feeSchedule = params.feeSchedule
    this.defaultLoanTime = params.defaultLoanTime
    this.mopServer = params.mopServer
    this.publicURL = params.publicURL ?? null
  }

  get entityID(): ID {
    return this.libraryID
  }

  abstract get allThings(): Iterable<Thing>

  get availableThings(): Iterable<Thing> {
    const result: Thing[] = []
    for (const thing of this.allThings) {
      if (thing.status === ThingStatus.READY) result.push(thing)
    }
    return result
  }

  get borrowers(): Iterable<Borrower> {
    return this._borrowers
  }

  addBorrower(borrower: Borrower): Borrower {
    this._borrowers.push(borrower)
    return borrower
  }

  canBorrow(borrower: Borrower): boolean {
    if (!borrower.libraryID || !borrower.libraryID.equals(this.entityID)) return false

    const feeAmounts = Array.from(borrower.fees)
      .filter((f) => f.status === FeeStatus.OUTSTANDING)
      .map((f) => f.amount)
    const totalFees = this.moneyFactory.total(feeAmounts)
    return totalFees.lessThanOrEqual(this.maxFinesBeforeSuspension)
  }

  async reserveItem(item: Thing, borrower: Borrower): Promise<WaitingList> {
    if (!item.entityID) {
      throw new Error('EntityNotAssignedIdError')
    }
    const key = item.entityID.toString()
    let waitingList = this.waitingListsByItemId.get(key)
    if (!waitingList) {
      waitingList = WaitingListFactory.createNewList(this, item)
      this.waitingListsByItemId.set(key, waitingList)
    }
    waitingList.add(borrower)
    return waitingList
  }

  getLoans(): Iterable<Loan> {
    return this._loans
  }
  addLoan(loan: Loan): void {
    this._loans.push(loan)
  }

  static getTitlesFromItems(items: Iterable<Thing>): Iterable<ThingTitle> {
    const titles: ThingTitle[] = []
    for (const item of items) {
      if (!titles.some((t) => t.equals(item.title))) titles.push(item.title)
    }
    return titles
  }

  abstract startBorrow(thing: Thing, borrower: Borrower): Promise<Thing>

  async rejectBorrow(thing: Thing, borrower: Borrower, reason: string): Promise<Thing>{
    thing.status = ThingStatus.READY

    // TODO store this reason somehow
    return thing
  }

  abstract finishBorrow(thing: Thing, borrower: Borrower, until: DueDate): Promise<Loan>

  abstract startReturn(loan: Loan): Promise<Loan>

  async rejectReturn(loan: Loan, reason: string): Promise<Loan> {
    loan.status = LoanStatus.RETURNED_DAMAGED;

    return loan;
  }

  async finishLibraryReturn(loan: Loan, borrower: Borrower): Promise<Loan> {
    if (loan.status !== LoanStatus.WAITING_ON_LENDER_ACCEPTANCE || !loan.timeReturned) {
      throw new Error('ReturnNotStartedError')
    }

    if (loan.item.status === ThingStatus.DAMAGED) {
      loan.status = LoanStatus.RETURNED_DAMAGED
    } else {
      if (loan.dueDate) {
        if (loan.timeReturned > (loan.dueDate.date ?? loan.timeReturned)) {
          loan.status = LoanStatus.OVERDUE
        } else {
          loan.status = LoanStatus.RETURNED
        }
      } else {
        loan.status = LoanStatus.RETURNED
      }
    }

    let fee_amount: Money | null = null
    if (loan.item.status === ThingStatus.DAMAGED) {
      // prefer camelCase per FeeSchedule interface; fall back if implementation uses snake_case
      const calculator =
        (this.feeSchedule as any).feeForDamagedItem ??
        (this.feeSchedule as any).fee_for_damaged_item
      if (calculator) fee_amount = calculator.call(this.feeSchedule, loan)
    }
    if (loan.status === LoanStatus.OVERDUE) {
      const calculator =
        (this.feeSchedule as any).feeForOverdueItem ??
        (this.feeSchedule as any).fee_for_overdue_item
      if (calculator) fee_amount = calculator.call(this.feeSchedule, loan)
    }

    if (fee_amount) {
      const fee = new LibraryFee({
        libraryFeeID: ID.generate(),
        libraryID: this.libraryID,
        amount: fee_amount,
        chargedForID: loan.loanID,
      })
      fee.status = FeeStatus.OUTSTANDING
      borrower.applyFee(fee)
    }

    const itemIdStr = loan.item.entityID?.toString()
    if (!itemIdStr) throw new Error('EntityNotAssignedIdError')

    const waitingList = this.waitingListsByItemId.get(itemIdStr)
    if (waitingList) {
      waitingList.reserveItemForNextBorrower()
    }

    if (loan.item.status === ThingStatus.BORROWED) {
      loan.item.status = ThingStatus.READY
    }

    return loan
  }
}
