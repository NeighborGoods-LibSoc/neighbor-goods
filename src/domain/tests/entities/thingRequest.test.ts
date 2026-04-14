import { describe, it, expect } from "vitest";
import { ThingRequest, ID, ThingRequestStatus, InvalidThingRequestStateTransitionError } from '@/domain';

describe("ThingRequest", () => {
  function makeThingRequest(status?: ThingRequestStatus): ThingRequest {
    return new ThingRequest({
      thingRequestID: ID.generate(),
      name: "Need a ladder",
      description: "Looking for a tall ladder to borrow",
      requestedBy: ID.generate(),
      status,
    });
  }

  it("defaults to OPEN status", () => {
    const request = makeThingRequest();
    expect(request.status).toBe(ThingRequestStatus.OPEN);
  });

  it("allows valid transition OPEN -> FULFILLED", () => {
    const request = makeThingRequest();
    request.fulfill();
    expect(request.status).toBe(ThingRequestStatus.FULFILLED);
  });

  it("allows valid transition OPEN -> CLOSED", () => {
    const request = makeThingRequest();
    request.close();
    expect(request.status).toBe(ThingRequestStatus.CLOSED);
  });

  it("allows valid transition CLOSED -> OPEN (reopen)", () => {
    const request = makeThingRequest(ThingRequestStatus.CLOSED);
    request.reopen();
    expect(request.status).toBe(ThingRequestStatus.OPEN);
  });

  it("rejects invalid transition FULFILLED -> OPEN", () => {
    const request = makeThingRequest(ThingRequestStatus.FULFILLED);
    expect(() => {
      request.status = ThingRequestStatus.OPEN;
    }).toThrowError(InvalidThingRequestStateTransitionError);
  });

  it("rejects invalid transition FULFILLED -> CLOSED", () => {
    const request = makeThingRequest(ThingRequestStatus.FULFILLED);
    expect(() => {
      request.status = ThingRequestStatus.CLOSED;
    }).toThrowError(InvalidThingRequestStateTransitionError);
  });

  it("rejects invalid transition CLOSED -> FULFILLED", () => {
    const request = makeThingRequest(ThingRequestStatus.CLOSED);
    expect(() => {
      request.status = ThingRequestStatus.FULFILLED;
    }).toThrowError(InvalidThingRequestStateTransitionError);
  });

  it("preserves requestedBy as immutable", () => {
    const ownerId = ID.generate();
    const request = new ThingRequest({
      thingRequestID: ID.generate(),
      name: "Need a drill",
      requestedBy: ownerId,
    });
    expect(request.requestedBy.equals(ownerId)).toBe(true);
  });

  it("allows setting status to the same value (no-op)", () => {
    const request = makeThingRequest();
    request.status = ThingRequestStatus.OPEN;
    expect(request.status).toBe(ThingRequestStatus.OPEN);
  });

  it("stores name and description correctly", () => {
    const request = makeThingRequest();
    expect(request.name).toBe("Need a ladder");
    expect(request.description).toBe("Looking for a tall ladder to borrow");
  });

  it("defaults description to null when not provided", () => {
    const request = new ThingRequest({
      thingRequestID: ID.generate(),
      name: "Need a drill",
      requestedBy: ID.generate(),
    });
    expect(request.description).toBeNull();
  });
});
