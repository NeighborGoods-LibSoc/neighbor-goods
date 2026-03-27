import type { Access, AccessArgs } from 'payload'
import type { User } from '@/payload-types'

export const isOwner =
  (fieldName: string = 'user'): Access<User> =>
  ({ req: { user } }: AccessArgs<User>) => {
    if (!user) {
      return false
    }

    return {
      [fieldName]: {
        equals: user.id,
      },
    }
  }
