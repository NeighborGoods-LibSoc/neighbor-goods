import { Entity } from './entity'
import { LibraryFee } from './libraries/libraryFee'
import { ID } from '../valueItems/id'
import { BorrowerVerificationFlags } from '../valueItems/borrowerVerificationFlags'

export abstract class Borrower extends Entity {
  libraryID!: ID;
  verificationFlags!: BorrowerVerificationFlags[];

  abstract get fees(): ReadonlyArray<LibraryFee>;
  abstract applyFee(fee: LibraryFee): this;
}
