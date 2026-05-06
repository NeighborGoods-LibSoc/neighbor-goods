import { Entity } from './entity'
import { BorrowerVerificationFlags, ID, LibraryFee } from '@/domain'

export abstract class Borrower extends Entity {
  libraryID!: ID;
  verificationFlags!: BorrowerVerificationFlags[];

  abstract get fees(): ReadonlyArray<LibraryFee>;
  abstract applyFee(fee: LibraryFee): this;
}
