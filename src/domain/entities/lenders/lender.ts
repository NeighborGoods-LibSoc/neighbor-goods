import { Entity } from "../entity";
import { Loan } from "../loan";
import { Thing } from "../thing";
import { Location } from "../../valueItems";

export abstract class Lender extends Entity {
  abstract get items(): Iterable<Thing>;
  abstract startReturn(loan: Loan): Promise<Loan>;
  abstract finishReturn(loan: Loan): Promise<Loan>;
  abstract get preferredReturnLocation(): Location;
}
