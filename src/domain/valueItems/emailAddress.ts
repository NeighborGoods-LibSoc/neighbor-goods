export class EmailAddress {
  public readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  equals(other: unknown): boolean {
    return other instanceof EmailAddress && other.value === this.value;
  }
}
