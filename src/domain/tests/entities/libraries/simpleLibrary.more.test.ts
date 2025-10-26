import { describe, it, expect } from "vitest";
import { SimpleLibrary } from "../../..";
import {
  ID,
  DueDate,
  LoanStatus,
  ThingStatus,
  ThingTitle,
  WaitingListType,
} from "../../../valueItems"
import { Person } from "../../..";
import { PersonName } from "../../..";
import { URL } from "../../..";
import { MOPServer } from "../../..";
import { Money, Currency } from "../../..";
import { MoneyFactory } from "../../..";
import { FeeSchedule } from "../../..";
import { Thing } from "../../..";
import { PhysicalLocation } from "../../..";

class TestFeeSchedule implements FeeSchedule {
  feeForOverdueItem() {
    return new Money({ amount: 5, currency: Currency.USD });
  }
  feeForDamagedItem() {
    return new Money({ amount: 20, currency: Currency.USD });
  }
}

describe("SimpleLibrary (expanded tests)", () => {
  function makeLibrary() {
    const admin = new Person({
      personID: ID.generate(),
      name: new PersonName({ firstName: "Admin", lastName: "User" }),
    });
    const feeSchedule = new TestFeeSchedule();
    const moneyFactory = new MoneyFactory();
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

  it("entityID returns libraryID", () => {
    const lib = makeLibrary();
    expect(lib.entityID.equals(lib.libraryID)).toBe(true);
  });

  it("add_item stores and returns item; all_things and items include it", () => {
    const lib = makeLibrary();
    const thing = makeThing();
    const result = lib.addItem(thing);
    expect(result).toBe(thing);
    expect(Array.from(lib.allThings)).toContain(thing);
    expect(Array.from(lib.items)).toContain(thing);
  });

  it("borrow with default due date sets reasonable future date", async () => {
    const lib = makeLibrary();
    const thing = makeThing();
    const borrower: any = {
      entityID: ID.generate(),
      libraryID: lib.entityID,
      fees: [],
      applyFee: () => borrower,
    };
    lib.addItem(thing);

    // monkey-patch can_borrow to true similar to Python test patch
    const original = lib.canBorrow.bind(lib);
    (lib as any).canBorrow = () => true;
    const loan = await lib.finishBorrow(thing, borrower);
    (lib as any).canBorrow = original;

    expect(loan.dueDate).toBeTruthy();
    const today = new Date();
    const dd = loan.dueDate.date!;
    expect(dd.getTime()).toBeGreaterThan(today.getTime() - 1000);
    // rough upper bound ~ 15 days out
    const upper = new Date();
    upper.setDate(upper.getDate() + 15);
    expect(dd.getTime()).toBeLessThan(upper.getTime());
  });

  it("rejects borrowing when item not READY", async () => {
    const lib = makeLibrary();
    const thing = makeThing();
    thing.status = ThingStatus.BORROWED;
    const borrower: any = { entity_id: ID.generate() };
    await expect(lib.startBorrow(thing, borrower)).rejects.toBeTruthy();
  });

  it("start_return sets WAITING_ON_LENDER_ACCEPTANCE and time_returned", async () => {
    const lib = makeLibrary();
    const thing = makeThing();
    const borrower: any = {
      entityID: ID.generate(),
      libraryID: lib.entityID,
      fees: [],
      applyFee: () => borrower,
    };
    (lib as any).canBorrow = () => true;
    const loan = await lib.finishBorrow(
      thing,
      borrower,
      new DueDate({ date: new Date(Date.now() + 8640000) }),
    );
    const res = await lib.startReturn(loan);
    expect(res.status).toBe(LoanStatus.WAITING_ON_LENDER_ACCEPTANCE);
    expect(res.timeReturned).toBeInstanceOf(Date);
  });

  it("all_titles deduplicates and available_titles filters by READY", () => {
    const lib = makeLibrary();
    // create raw "Thing"-like objects for titles only by using real Things and adjusting status
    const t1 = makeThing();
    t1.title = new ThingTitle({ name: "Book 1" });
    t1.status = ThingStatus.READY;
    const t2 = makeThing();
    t2.title = new ThingTitle({ name: "Book 2" });
    t2.status = ThingStatus.READY;
    const t3 = makeThing();
    t3.title = new ThingTitle({ name: "Book 1" });
    t3.status = ThingStatus.BORROWED;
    lib.addItem(t1);
    lib.addItem(t2);
    lib.addItem(t3);

    const all = Array.from(lib.allTitles);
    expect(
      all.some((tt) => tt.equals(new ThingTitle({ name: "Book 1" }))),
    ).toBe(true);
    expect(
      all.some((tt) => tt.equals(new ThingTitle({ name: "Book 2" }))),
    ).toBe(true);
    expect(all.length).toBe(2);

    const avail = Array.from(lib.available_titles);
    expect(avail.length).toBe(2);
    expect(
      avail.some((tt) => tt.equals(new ThingTitle({ name: "Book 3" }))),
    ).toBe(false);
  });

  it("preferred_return_location returns library.location", () => {
    const lib = makeLibrary();
    expect(lib.preferredReturnLocation).toEqual(lib.location);
  });
});
