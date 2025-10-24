import { describe, it, expect } from "vitest";
import { FirstComeFirstServeWaitingList } from "../../..";
import { WaitingList } from "../../..";
import { WaitingListFactory } from "../../..";
import { WaitingListType } from "../../..";
import { Thing } from "../../..";
import { ID } from "../../..";
import { ThingTitle } from "../../..";
import { PhysicalLocation } from "../../..";
import { PersonBorrower } from "../../..";
import { PersonName } from "../../..";
import { ThingStatus } from "../../..";

function makeThing(): Thing {
  return new Thing({
    thing_id: ID.generate(),
    title: new ThingTitle({ name: "Saw" }),
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

function makeBorrower(libraryID: ID): PersonBorrower {
  return new PersonBorrower({
    personID: ID.generate(),
    name: new PersonName({ firstName: "B", lastName: "R" }),
    libraryID: libraryID,
  });
}

describe("FirstComeFirstServeWaitingList", () => {
  it("add and is_on_list works", () => {
    const item = makeThing();
    const wl = new FirstComeFirstServeWaitingList({ item });
    const borrower = makeBorrower(ID.generate());
    expect(wl.isOnList(borrower)).toBe(false);
    wl.add(borrower);
    expect(wl.isOnList(borrower)).toBe(true);
  });

  it("find_next_borrower returns the first added", () => {
    const item = makeThing();
    const wl = new FirstComeFirstServeWaitingList({ item });
    const b1 = makeBorrower(ID.generate());
    const b2 = makeBorrower(ID.generate());
    wl.add(b1).add(b2);
    const nextB = wl.findNextBorrower();
    expect(nextB?.entityID.equals(b1.entityID)).toBe(true);
  });

  it("reserve_item_for_next_borrower sets reservation and item status RESERVED", () => {
    const item = makeThing();
    const wl = new FirstComeFirstServeWaitingList({ item });
    const b1 = makeBorrower(ID.generate());
    const b2 = makeBorrower(ID.generate());
    wl.add(b1).add(b2);
    const res = wl.reserveItemForNextBorrower();
    expect(res.holder.entityID.equals(b1.entityID)).toBe(true);
    expect(item.status).toBe(ThingStatus.RESERVED);
    // b1 should be removed from list
    expect(wl.isOnList(b1)).toBe(false);
  });

  it("cancel removes a borrower from the list", () => {
    const wl = new FirstComeFirstServeWaitingList({ item: makeThing() });
    const b1 = makeBorrower(ID.generate());
    const b2 = makeBorrower(ID.generate());
    wl.add(b1).add(b2);
    wl.cancel(b1);
    expect(wl.isOnList(b1)).toBe(false);
    expect(wl.isOnList(b2)).toBe(true);
  });

  it("process_reservation_expired clears current reservation", () => {
    const wl = new FirstComeFirstServeWaitingList({ item: makeThing() });
    const b1 = makeBorrower(ID.generate());
    wl.add(b1);
    const res = wl.reserveItemForNextBorrower();
    expect(wl.currentReservation).toBeTruthy();
    // In our minimal TS implementation, status is not changed here, but clear_current_reservation should execute
    wl.processReservationExpired(res);
    expect(wl.currentReservation).toBeNull();
  });
});

describe("WaitingListFactory", () => {
  it("creates FCFS or Null waiting lists", () => {
    const item = makeThing();
    const fcfs = WaitingListFactory.createNewList(
      { waitingListType: WaitingListType.FIRST_COME_FIRST_SERVE },
      item,
    );
    expect(fcfs).toBeInstanceOf(FirstComeFirstServeWaitingList);

    const none = WaitingListFactory.createNewList(
      { waitingListType: WaitingListType.NONE },
      item,
    );
    expect((none as WaitingList).getReservationTime().days).toBe(0);
  });
});
