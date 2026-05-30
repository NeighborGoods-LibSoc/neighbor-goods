import { describe, it, expect } from "vitest";
import { Thing, ID, ThingTitle, ThingStatus, PhysicalLocation, InvalidThingStatusToBorrowError } from '@/domain';

describe("Thing", () => {
  function makeThing(): Thing {
    return new Thing({
      thing_id: ID.generate(),
      title: new ThingTitle({ name: "Drill" }),
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

  it("throws InvalidThingStatusToBorrowError when requesting to borrow a non-READY item", () => {
    const thing = makeThing()
    const borrowerId = ID.generate()

    // Move to BORROWED status
    thing.status = ThingStatus.BORROWED

    expect(() => thing.requestBorrow(borrowerId)).toThrowError(InvalidThingStatusToBorrowError)
  })

  it("allows valid status transitions and rejects invalid", () => {
    const thing = makeThing();
    expect(thing.status).toBe(ThingStatus.READY);

    thing.status = ThingStatus.BORROWED;
    expect(thing.status).toBe(ThingStatus.BORROWED);

    // Invalid: DAMAGED -> BORROWED is not allowed
    thing.status = ThingStatus.DAMAGED;
    expect(() => {
      thing.status = ThingStatus.BORROWED;
    }).toThrowError();

    // Valid: DAMAGED -> READY is allowed
    thing.status = ThingStatus.READY;
    expect(thing.status).toBe(ThingStatus.READY);
  });
});
