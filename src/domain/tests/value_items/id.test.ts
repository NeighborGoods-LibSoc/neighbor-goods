import { describe, it, expect } from "vitest";
import { ID } from '../../value_items';

describe("ID", () => {
  it("generates and parses UUIDs", () => {
    const id = ID.generate();
    const parsed = ID.parse(id.toString());
    expect(parsed.equals(id)).toBe(true);
  });
});
