import type { Access } from 'payload'
import type { User } from '@/payload-types'

/**
 * Access control that checks if the current user is the owner of the document.
 * Used for update/delete operations on items to ensure only the owner can modify them.
 *
 * @param ownerField - The field name that contains the owner relationship (default: 'offeredBy')
 */
export const isOwner = (ownerField: string = 'offeredBy'): Access<User> => {
  return ({ req: { user }, id }) => {
    // Must be authenticated
    if (!user) {
      return false
    }

    // If no document ID, allow (this is a create operation, handled separately)
    if (!id) {
      return true
    }

    // Return a query constraint that Payload will use to verify ownership
    // This is more secure than fetching the doc ourselves as Payload handles it atomically
    return {
      [ownerField]: {
        equals: user.id,
      },
    }
  }
}
