import { describe, it, expect } from "vitest";
import { DistributedLibrary } from "../../..";
import { SimpleLibrary } from "../../..";
import { Thing } from "../../..";
import { ID } from "../../..";
import { ThingTitle } from "../../..";
import { PhysicalLocation } from "../../..";
import { PhysicalArea } from "../../..";
import { Distance } from "../../..";
import { Person } from "../../..";
import { PersonName } from "../../..";
import { URL } from "../../..";
import { MOPServer } from "../../..";
import { Money, Currency } from "../../..";
import { FeeSchedule } from "../../..";
import { WaitingListType } from "../../..";
import { LoanStatus } from "../../..";
import { ThingStatus } from "../../..";
import { DueDate } from "../../..";

class TestFeeSchedule implements FeeSchedule {
  feeForOverdueItem() {
    return new Money({ amount: 0, currency: Currency.USD });
  }
  feeForDamagedItem() {
    return new Money({ amount: 0, currency: Currency.USD });
  }
}

function makePerson(name: string) {
  return new Person({
    personID: ID.generate(),
    name: new PersonName({ firstName: name, lastName: "Admin" }),
  });
}

function makeSimpleLibrary(name: string) {
  const lib = new SimpleLibrary({
    libraryID: ID.generate(),
    name,
    administrator: makePerson(name),
    waitingListType: WaitingListType.FIRST_COME_FIRST_SERVE,
    maxFinesBeforeSuspension: new Money({
      amount: 100,
      currency: Currency.USD,
    }),
    feeSchedule: new TestFeeSchedule(),
    defaultLoanTime: { days: 14 },
    mopServer: MOPServer.localhost(),
    publicURL: URL.parse("https://example.com") as any,
  });
  lib.location = new PhysicalLocation({
    streetAddress: "1 Main",
    city: "X",
    state: "Y",
    zip_code: "00000",
    country: "US",
  });
  (lib as any).moneyFactory.defaultCurrency = Currency.USD;
  return lib;
}

function makeDistributedLibrary() {
  const dl = new DistributedLibrary({
    libraryID: ID.generate(),
    name: "Distributed",
    administrator: makePerson("Dist"),
    waitingListType: WaitingListType.FIRST_COME_FIRST_SERVE,
    maxFinesBeforeSuspension: new Money({
      amount: 100,
      currency: Currency.USD,
    }),
    feeSchedule: new TestFeeSchedule(),
    defaultLoanTime: { days: 7 },
    mopServer: MOPServer.localhost(),
    publicURL: URL.parse("https://distributed.example") as any,
  });
  (dl as any).moneyFactory.defaultCurrency = Currency.USD;
  dl.area = new PhysicalArea({
    centerPoint: new PhysicalLocation({
      streetAddress: "1 Center",
      city: "X",
      state: "Y",
      zipCode: "00000",
      country: "US",
    }),
    radius: new Distance(50),
  });
  return dl;
}

function makeThing(owner_id: ID): Thing {
  return new Thing({
    thing_id: ID.generate(),
    title: new ThingTitle({ name: "Ladder" }),
    description: null,
    owner_id,
    storage_location: new PhysicalLocation({
      streetAddress: "2 Main",
      city: "X",
      state: "Y",
      zip_code: "00000",
      country: "US",
    }),
  });
}

describe("DistributedLibrary", () => {
  it("aggregates lender items and borrows via owning lender", async () => {
    const dl = makeDistributedLibrary();
    const lender1 = makeSimpleLibrary("L1");
    const lender2 = makeSimpleLibrary("L2");
    dl.addLender(lender1);
    dl.addLender(lender2);

    const thing = makeThing(lender1.libraryID);
    lender1.addItem(thing);

    const borrower: any = {
      entityID: ID.generate(),
      libraryID: dl.entityID,
      fees: [],
    };

    const until = new DueDate({ date: new Date(Date.now() + 3 * 86400000) });
    const loan = await dl.borrow(thing, borrower, until);

    expect(loan.status).toBe(LoanStatus.BORROWED);
    expect(thing.status).toBe(ThingStatus.BORROWED);
    // return_location should be owner's preferred_return_location (lender1)
    expect(loan.returnLocation).toEqual(lender1.preferredReturnLocation);
  });

  it("start_return delegates to owner and marks waiting on acceptance", async () => {
    const dl = makeDistributedLibrary();
    const lender = makeSimpleLibrary("L1");
    dl.addLender(lender);
    const thing = makeThing(lender.libraryID);
    lender.addItem(thing);

    const borrower: any = {
      entityID: ID.generate(),
      libraryID: dl.entityID,
      fees: [],
    };
    const loan = await dl.borrow(
      thing,
      borrower,
      new DueDate({ date: new Date(Date.now() + 86400000) }),
    );

    const updated = await dl.startReturn(loan);
    expect(updated.status).toBe(LoanStatus.WAITING_ON_LENDER_ACCEPTANCE);
    expect(loan.timeReturned).toBeInstanceOf(Date);
  });
});
