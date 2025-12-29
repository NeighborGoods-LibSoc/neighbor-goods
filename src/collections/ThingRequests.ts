import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { isOwner } from '../access/isOwner'
import { RequestStatus } from '../domain/valueItems/requestStatus'
import statusTransitions from '../domain/valueItems/statusTransitions.json'

export const ThingRequests: CollectionConfig = {
  slug: 'requests',
  access: {
    create: authenticated,
    delete: isOwner('requestedBy'),
    read: anyone,
    update: isOwner('requestedBy'),
  },
  admin: {
    defaultColumns: ['name', 'status', 'requestedBy', 'tags', 'updatedAt'],
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
      defaultValue: RequestStatus.OPEN,
      options: [
        { label: 'Open', value: RequestStatus.OPEN },
        { label: 'Fulfilled', value: RequestStatus.FULFILLED },
        { label: 'Closed', value: RequestStatus.CLOSED },
      ],
      admin: {
        position: 'sidebar',
        description: 'Current status of this request',
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
        description: 'Select tags to categorize this request',
      },
    },
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'referenceImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Optional reference image showing what you are looking for',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (!data) return data

        // On create, force requestedBy to be the authenticated user (prevent spoofing)
        if (operation === 'create') {
          if (!req.user) {
            throw new Error('You must be logged in to create a request')
          }
          // Always set requestedBy to the authenticated user, ignoring client input
          data.requestedBy = req.user.id
          return data
        }

        // On update, prevent changing the owner
        if (originalDoc?.requestedBy) {
          // Preserve original owner, ignore any attempt to change it
          const originalOwnerId =
            typeof originalDoc.requestedBy === 'object'
              ? originalDoc.requestedBy.id
              : originalDoc.requestedBy
          data.requestedBy = originalOwnerId
        }

        // Validate status transition using shared config
        const currentStatus = originalDoc?.status || RequestStatus.OPEN
        const newStatus = data.status || currentStatus

        if (currentStatus !== newStatus) {
          const transitions = statusTransitions.requestStatus as Record<string, string[]>
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
