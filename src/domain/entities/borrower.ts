import { Entity, LibraryFee, ID, BorrowerVerificationFlags } from "..";

export abstract class Borrower extends Entity {
  libraryID!: ID;
  verificationFlags!: BorrowerVerificationFlags[];

  abstract get fees(): ReadonlyArray<LibraryFee>;
  abstract applyFee(fee: LibraryFee): this;
}
