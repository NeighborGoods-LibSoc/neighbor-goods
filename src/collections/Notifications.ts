import type { CollectionConfig, Access } from 'payload'
import type { User } from '@/payload-types'

import { authenticated } from '@/access/authenticated'

/**
 * Notifications for users — borrow requests, approvals, returns, etc.
 * Each notification belongs to a single recipient and links to the relevant item.
 */

const isRecipient: Access<User> = ({ req: { user } }) => {
  if (!user) return false
  return {
    recipient: {
      equals: user.id,
    },
  }
}

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  access: {
    create: authenticated,
    delete: isRecipient,
    read: isRecipient,
    update: isRecipient,
  },
  admin: {
    defaultColumns: ['recipient', 'type', 'message', 'read', 'createdAt'],
    useAsTitle: 'message',
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Borrow Request', value: 'borrow_request' },
        { label: 'Borrow Approved', value: 'borrow_approved' },
        { label: 'Borrow Rejected', value: 'borrow_rejected' },
        { label: 'Item Returned', value: 'item_returned' },
        { label: 'Item Damaged', value: 'item_damaged' },
      ],
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'item',
      type: 'relationship',
      relationTo: 'items',
      required: false,
    },
    {
      name: 'triggeredBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description: 'The user who triggered this notification',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the notification has been read',
      },
    },
    {
      name: 'actionURL',
      type: 'text',
      required: false,
      admin: {
        description: 'URL to navigate to when notification is clicked',
      },
    },
  ],
  timestamps: true,
}
