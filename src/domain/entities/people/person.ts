import { Entity } from "../entity";
import { ID, PersonName, EmailAddress } from "../../valueItems";

export class Person extends Entity {
  personID: ID;
  name: PersonName;
  emails: EmailAddress[];

  constructor(params: {
    personID: ID;
    name: PersonName;
    emails?: EmailAddress[];
  }) {
    super();
    this.personID = params.personID;
    this.name = params.name;
    this.emails = params.emails ?? [];
  }

  get entityID(): ID {
    return this.personID;
  }

  get preferredEmail(): EmailAddress | null {
    if (!this.emails || this.emails.length === 0) return null;
    return this.emails[0] as EmailAddress;
  }
}
