import { ID } from "./id";
import { Money } from "./money";

export class AuctionBid {
  public readonly amountBid: Money;
  public readonly amountPaid: Money;
  public readonly madeByID: ID;
  public readonly madeForID: ID;

  constructor(params: {
    amountBid: Money;
    amountPaid: Money;
    madeByID: ID;
    madeForID: ID;
  }) {
    this.amountBid = params.amountBid;
    this.amountPaid = params.amountPaid;
    this.madeByID = params.madeByID;
    this.madeForID = params.madeForID;
  }

  equals(other: unknown): boolean {
    if (!(other instanceof AuctionBid)) return false;
    return (
      this.amountBid.equals(other.amountBid) &&
      this.amountPaid.equals(other.amountPaid) &&
      this.madeByID.equals(other.madeByID) &&
      this.madeForID.equals(other.madeForID)
    );
  }

  hash(): number {
    const s = [
      this.amountBid.toJSON().amount,
      this.amountPaid.toJSON().amount,
      this.madeByID.toString(),
      this.madeForID.toString(),
    ].join("|");
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      const chr = s.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return hash;
  }
}
