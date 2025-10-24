import { Location } from "./location";
import { PhysicalLocation } from "./physicalLocation";
import { Distance } from "./distance";

export class PhysicalArea implements Location {
  public readonly centerPoint: PhysicalLocation;
  public readonly radius: Distance;

  constructor(params: { centerPoint: PhysicalLocation; radius: Distance }) {
    this.centerPoint = params.centerPoint;
    this.radius = params.radius;
  }

  contains(other: Location): boolean {
    if (other instanceof PhysicalLocation) {
      const distance = this.centerPoint.distance(other);
      return distance.lt(this.radius);
    } else if (other instanceof PhysicalArea) {
      const offset = this.centerPoint.distance(other.centerPoint);
      return offset.add(other.radius).lt(this.radius);
    }
    throw new Error(`Cannot compute contain for location type ${typeof other}`);
  }
}
