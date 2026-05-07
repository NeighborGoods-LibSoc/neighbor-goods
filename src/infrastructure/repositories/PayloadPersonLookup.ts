import { Payload } from 'payload'
import { ID } from '@/domain/valueItems/id'
import { PersonLookup } from '@/domain/services/NotificationService'

export class PayloadPersonLookup implements PersonLookup {
  constructor(private payload: Payload) {}

  async getPersonName(personId: ID): Promise<string> {
    try {
      const result = await this.payload.find({
        collection: 'users',
        where: { user_id: { equals: personId.toString() } },
        limit: 1,
      })
      return result.docs[0]?.name || 'A neighbor'
    } catch {
      return 'A neighbor'
    }
  }
}
