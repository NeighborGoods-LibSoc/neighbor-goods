import { Payload } from 'payload'
import { ID } from '@/domain/valueItems/id'
import { PersonLookup } from '@/domain/services/NotificationService'

export class PayloadPersonLookup implements PersonLookup {
  constructor(private payload: Payload) {}

  async getPersonName(personId: ID): Promise<string> {
    try {
      const user = await this.payload.findByID({
        collection: 'users',
        id: personId.toString(),
      })
      return user?.name || 'A neighbor'
    } catch {
      return 'A neighbor'
    }
  }
}
