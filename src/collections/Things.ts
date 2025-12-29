import type { CollectionConfig, Access } from 'payload'
import type { User } from '@/payload-types'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { isOwner } from '../access/isOwner'
import { ThingStatus } from '../domain/valueItems/thingStatus'
import { ID } from '../domain/valueItems'
import { ThingService } from '../domain/services/ThingService'
import { PayloadBorrowRequestRepository } from '../infrastructure/repositories/PayloadBorrowRequestRepository'
import { buildDomainThingFromData, thingToPayloadData } from './common/mappers'

/**
 * Custom access control for item updates:
 * - Owner can always update
 * - Non-owners can update ONLY to request borrowing (READY -> WAITING_FOR_LENDER_APPROVAL_TO_BORROW)
 */
const canUpdateItem: Access<User> = async ({ req: { user }, id }) => {
  if (!user) return false
  if (!id) return true // Create operation handled separately
  return true // Validation handled in beforeChange hook
}

export const Things: CollectionConfig = {
  slug: 'items',
  access: {
    create: authenticated,
    delete: isOwner('offeredBy'),
    read: anyone,
    update: canUpdateItem,
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
    {
      name: 'requestedToBorrowBy',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        position: 'sidebar',
        description: 'User who has requested to borrow this item (pending approval)',
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
            throw new Error('You must be logged in to offer an item')
          }
          data.offeredBy = req.user.id
          return data
        }

        // UPDATE: Use domain layer
        if (!req.user) {
          throw new Error('You must be logged in to update an item')
        }

        const thing = buildDomainThingFromData(originalDoc)
        const userId = ID.parse(req.user.id)
        const newStatus = (data.status as ThingStatus) || thing.status

        // Non-owner requesting to borrow
        if (!thing.isOwnedBy(userId)) {
          if (newStatus !== ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
            throw new Error('You can only request to borrow items that are available')
          }

          const borrowRequestRepo = new PayloadBorrowRequestRepository(req.payload)
          const thingService = new ThingService(borrowRequestRepo)
          await thingService.requestBorrow(thing, userId)

          return thingToPayloadData(thing, originalDoc)
        }

        // Owner actions
        const currentStatus = thing.status

        if (currentStatus === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
          if (newStatus === ThingStatus.READY) {
            thing.rejectBorrowRequest()
          } else if (newStatus === ThingStatus.BORROWED) {
            thing.approveBorrowRequest()
          } else if (newStatus === ThingStatus.RESERVED) {
            thing.reserve()
          }
        } else if (newStatus !== currentStatus) {
          // Generic status change - setter validates transition
          thing.status = newStatus
        }

        return thingToPayloadData(thing, originalDoc)
      },
    ],
  },
  timestamps: true,
}
