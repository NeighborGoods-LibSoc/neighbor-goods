import { ID } from "../valueItems";

export abstract class Entity {
  // In TS we expose an abstract getter similar to Python's abstract property
  abstract get entityID(): ID;

  equals(other: unknown): boolean {
    return other instanceof Entity && this.entityID.equals(other.entityID);
  }
}
