import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { isOwner } from '../access/isOwner'
import { ThingStatus } from '../domain/valueItems/thingStatus'
import statusTransitions from '../domain/valueItems/statusTransitions.json'

export const Items: CollectionConfig = {
  slug: 'items',
  access: {
    create: authenticated,
    delete: isOwner('offeredBy'),
    read: anyone,
    update: isOwner('offeredBy'),
  },
  admin: {
    defaultColumns: ['name', 'status', 'offeredBy', 'tags', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: ThingStatus.READY,
      options: [
        { label: 'Ready', value: ThingStatus.READY },
        { label: 'Waiting for Lender Approval', value: ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW },
        { label: 'Borrowed', value: ThingStatus.BORROWED },
        { label: 'Damaged', value: ThingStatus.DAMAGED },
        { label: 'Reserved', value: ThingStatus.RESERVED },
      ],
      admin: {
        position: 'sidebar',
        description: 'Current availability status of this item',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      required: false,
      admin: {
        description: 'Select tags to categorize this item',
      },
    },
    {
      name: 'rulesForUse',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Rules and guidelines for using this item',
      },
    },
    {
      name: 'borrowingTime',
      type: 'number',
      required: true,
      admin: {
        description: 'Maximum borrowing time in days',
      },
    },
    {
      name: 'offeredBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'primaryImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Primary image used as thumbnail',
      },
    },
    {
      name: 'additional_images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Additional images for this item',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (!data) return data

        // On create, force offeredBy to be the authenticated user (prevent spoofing)
        if (operation === 'create') {
          if (!req.user) {
            throw new Error('You must be logged in to offer an item')
          }
          // Always set offeredBy to the authenticated user, ignoring client input
          data.offeredBy = req.user.id
          return data
        }

        // On update, prevent changing the owner
        if (originalDoc?.offeredBy) {
          // Preserve original owner, ignore any attempt to change it
          const originalOwnerId =
            typeof originalDoc.offeredBy === 'object'
              ? originalDoc.offeredBy.id
              : originalDoc.offeredBy
          data.offeredBy = originalOwnerId
        }

        // Validate status transition using shared config
        const currentStatus = originalDoc?.status || ThingStatus.READY
        const newStatus = data.status || currentStatus

        if (currentStatus !== newStatus) {
          const transitions = statusTransitions.thingStatus as Record<string, string[]>
          const validNextStatuses = transitions[currentStatus] || []

          if (!validNextStatuses.includes(newStatus)) {
            throw new Error(
              `Invalid status transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${validNextStatuses.join(', ') || 'none'}`,
            )
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
