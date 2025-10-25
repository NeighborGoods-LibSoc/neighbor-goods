import { describe, it, expect } from "vitest";
import { SimpleLibrary } from "../../../entities/libraries/simpleLibrary";
import {
  ID,
  DueDate,
  LoanStatus,
  ThingStatus,
  ThingTitle,
  WaitingListType,
} from '../../../valueItems'
import { Person } from "../../../entities/people/person";
import { PersonName } from "../../../valueItems/personName";
import { URL } from "../../../valueItems/url";
import { MOPServer } from "../../../entities/mopServer";
import { Money, Currency } from "../../../valueItems/money";
import { MoneyFactory } from "../../../factories/moneyFactory";
import { FeeSchedule } from "../../../valueItems/feeSchedules/feeSchedule";
import { Thing } from "../../../entities/thing";
import { PhysicalLocation } from "../../../valueItems/location/physicalLocation";

class TestFeeSchedule implements FeeSchedule {
  feeForOverdueItem(): Money {
    return new Money({ amount: 5, currency: Currency.USD });
  }
  feeForDamagedItem(): Money {
    return new Money({ amount: 20, currency: Currency.USD });
  }
}

describe("SimpleLibrary", () => {
  function makeLibrary() {
    const admin = new Person({
      personID: ID.generate(),
      name: new PersonName({ firstName: "Admin", lastName: "User" }),
    });
    const feeSchedule = new TestFeeSchedule();
    const mopServer = MOPServer.localhost();

    const lib = new SimpleLibrary({
      libraryID: ID.generate(),
      name: "Test Simple Library",
      administrator: admin,
      waitingListType: WaitingListType.FIRST_COME_FIRST_SERVE,
      maxFinesBeforeSuspension: new Money({
        amount: 50,
        currency: Currency.USD,
      }),
      feeSchedule,
      defaultLoanTime: { days: 14 },
      mopServer,
      publicURL: URL.parse("https://example.com") as any,
    });
    lib.location = new PhysicalLocation({
      streetAddress: "1 Main",
      city: "X",
      state: "Y",
      zipCode: "00000",
      country: "US",
    });
    // Ensure moneyFactory exists before setting its property
    if (!(lib as any).moneyFactory) {
      (lib as any).moneyFactory = new MoneyFactory();
    }
    (lib as any).moneyFactory.defaultCurrency = Currency.USD;
    return lib;
  }

  function makeThing(): Thing {
    return new Thing({
      thing_id: ID.generate(),
      title: new ThingTitle({ name: "Test Book" }),
      description: null,
      owner_id: ID.generate(),
      storage_location: new PhysicalLocation({
        streetAddress: "1 Main",
        city: "X",
        state: "Y",
        zipCode: "00000",
        country: "US",
      }),
    });
  }

  it("borrows when thing ready and borrower in good standing", async () => {
    const lib = makeLibrary();
    const thing = makeThing();
    const borrower = new Person({
      personID: ID.generate(),
      name: new PersonName({ firstName: "B", lastName: "R" }),
    }) as any;
    (borrower as any).libraryID = lib.entityID; // minimal borrower shape
    (borrower as any).fees = [];
    (borrower as any).applyFee = () => borrower;

    lib.addItem(thing);
    const until = new DueDate({ date: new Date(Date.now() + 3 * 86400000) });
    const loan = await lib.borrow(thing, borrower, until);
    expect(loan.status).toBe(LoanStatus.BORROWED);
    expect(thing.status).toBe(ThingStatus.BORROWED);
  });
});
