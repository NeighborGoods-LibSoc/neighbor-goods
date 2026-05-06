import type { CollectionConfig } from 'payload'
import { uuidField } from '@/fields/uuid'

import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
import { isOwner } from '@/access/isOwner'
import { ThingRequestStatus } from '@/domain'
import { requestStatusTransitions } from '@/domain/valueItems/statusTransitions'

export const ThingRequests: CollectionConfig = {
  slug: 'thing-requests',
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
    uuidField({ name: 'request_id', label: 'Request ID', description: 'UUID for this request' }),
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: ThingRequestStatus.OPEN,
      options: [
        { label: 'Open', value: ThingRequestStatus.OPEN },
        { label: 'Fulfilled', value: ThingRequestStatus.FULFILLED },
        { label: 'Closed', value: ThingRequestStatus.CLOSED },
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
          data.requestedBy =
            typeof originalDoc.requestedBy === 'object'
              ? originalDoc.requestedBy.id
              : originalDoc.requestedBy
        }

        // Validate status transition using shared config
        const currentStatus: ThingRequestStatus = (originalDoc?.status as ThingRequestStatus) || ThingRequestStatus.OPEN
        const newStatus: ThingRequestStatus = (data.status as ThingRequestStatus) || currentStatus

        if (currentStatus !== newStatus) {
          const validNextStatuses = requestStatusTransitions[currentStatus] || []

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
