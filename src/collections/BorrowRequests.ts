import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

/**
 * Tracks borrow requests for cooldown purposes.
 * Each record represents a user's request to borrow a specific item,
 * storing the timestamp for cooldown enforcement (1 hour per user per item).
 */
export const BorrowRequests: CollectionConfig = {
  slug: 'borrow-requests',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['item', 'requestedBy', 'requestedAt', 'updatedAt'],
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'item',
      type: 'relationship',
      relationTo: 'items',
      required: true,
      index: true,
    },
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'requestedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'Timestamp of when the borrow request was made',
      },
    },
  ],
  timestamps: true,
}
