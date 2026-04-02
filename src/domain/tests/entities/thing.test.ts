import { describe, it, expect } from "vitest";
import { Thing, ID, ThingTitle, ThingStatus, PhysicalLocation } from '@/domain';

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

  it("allows valid status transitions and rejects invalid", () => {
    const thing = makeThing();
    expect(thing.status).toBe(ThingStatus.READY);

    thing.status = ThingStatus.BORROWED;
    expect(thing.status).toBe(ThingStatus.BORROWED);

    // Invalid: READY is not a valid target from BORROWED (only RESERVED and DAMAGED are, plus READY is also valid per transitions)
    // Test a truly invalid transition: BORROWED -> WAITING_FOR_LENDER_APPROVAL_TO_BORROW is not allowed
    expect(() => {
      thing.status = ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW;
    }).toThrowError();
  });
});
