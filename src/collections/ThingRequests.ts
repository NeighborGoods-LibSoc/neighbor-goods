import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
import { isOwner } from '@/access/isOwner'
import { ThingRequestStatus } from '@/domain'
import { buildDomainThingRequestFromData, thingRequestToPayloadData } from './common/mappers'

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

        // CREATE: Set owner to authenticated user
        if (operation === 'create') {
          if (!req.user) {
            throw new Error('You must be logged in to create a request')
          }
          data.requestedBy = req.user.id
          return data
        }

        // UPDATE: Use domain layer
        const thingRequest = buildDomainThingRequestFromData(originalDoc)

        // Owner immutability: domain object preserves the original requestedBy
        data.requestedBy = thingRequest.requestedBy.toString()

        // Apply status transition through the domain entity (validates the transition)
        const newStatus = data.status || thingRequest.status
        if (newStatus !== thingRequest.status) {
          thingRequest.status = newStatus
        }

        return thingRequestToPayloadData(thingRequest, data)
      },
    ],
  },
  timestamps: true,
}
