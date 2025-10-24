export class PersonName {
  public readonly salutation?: string;
  public readonly firstName: string;
  public readonly middleName?: string;
  public readonly lastName: string;
  public readonly suffix?: string;

  constructor(params: {
    salutation?: string | null;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    suffix?: string | null;
  }) {
    this.salutation = params.salutation ?? undefined;
    this.firstName = params.firstName;
    this.middleName = params.middleName ?? undefined;
    this.lastName = params.lastName;
    this.suffix = params.suffix ?? undefined;
  }
}
