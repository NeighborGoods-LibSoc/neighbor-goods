import { describe, it, expect } from "vitest";
import { Thing } from "../../entities/thing";
import { ID } from "../../valueItems/id";
import { ThingTitle } from "../../valueItems/thingTitle";
import { ThingStatus } from "../../valueItems/thingStatus";
import { PhysicalLocation } from "../../valueItems/location/physical_location";

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
        zip_code: "00000",
        country: "US",
      }),
    });
  }

  it("allows valid status transitions and rejects invalid", () => {
    const thing = makeThing();
    expect(thing.status).toBe(ThingStatus.READY);

    thing.status = ThingStatus.BORROWED;
    expect(thing.status).toBe(ThingStatus.BORROWED);

    // Invalid: BORROWED -> READY is valid, but BORROWED -> DAMAGED is allowed too; test invalid by going DAMAGED -> READY
    thing.status = ThingStatus.DAMAGED;
    expect(() => {
      thing.status = ThingStatus.READY;
    }).toThrowError();
  });
});
