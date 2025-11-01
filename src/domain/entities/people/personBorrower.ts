import { Borrower } from "../borrower";
import { LibraryFee } from "../libraries/libraryFee";
import { Person } from "./person";
import { ID, BorrowerVerificationFlags } from "../../valueItems";

export class PersonBorrower extends Person implements Borrower {
  libraryID: ID;
  verificationFlags: BorrowerVerificationFlags[] = [];
  private _fees: LibraryFee[] = [];

  constructor(params: {
    personID: ID;
    name: Person["name"];
    emails?: Person["emails"];
    libraryID: ID;
    verificationFlags?: BorrowerVerificationFlags[];
  }) {
    super({
      personID: params.personID,
      name: params.name,
      emails: params.emails,
    });
    this.libraryID = params.libraryID;
    this.verificationFlags = params.verificationFlags ?? [];
  }

  get fees(): ReadonlyArray<LibraryFee> {
    return this._fees;
  }

  applyFee(fee: LibraryFee): this {
    this._fees.push(fee);
    return this;
  }
}
