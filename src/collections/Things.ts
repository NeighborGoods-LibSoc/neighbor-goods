import type { CollectionConfig, Access } from 'payload'
import type { User } from '@/payload-types'

import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
import { isOwner } from '@/access/isOwner'
import { uuidField } from '@/fields/uuid'
import { ThingStatus } from '@/domain'
import { ID } from '@/domain'
import { ThingService } from '@/domain'
import { NotificationService } from '@/domain'
import { PayloadBorrowRequestRepository } from '@/infrastructure/repositories/PayloadBorrowRequestRepository'
import { PayloadNotificationRepository } from '@/infrastructure/repositories/PayloadNotificationRepository'
import { PayloadPersonLookup } from '@/infrastructure/repositories/PayloadPersonLookup'
import { buildDomainThingFromData, thingToPayloadData } from './common/mappers'
import { v4 as uuidv4 } from 'uuid'

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
    uuidField({ name: 'item_id', description: 'UUID for the item (domain ID)' }),
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
        {
          label: 'Waiting for Lender Approval',
          value: ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW,
        },
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
    beforeValidate: [
      async ({ data, operation }) => {
        if (!data) return data
        if (operation === 'create' && !data.item_id) {
          data.item_id = ID.generate().toString()
        }
        return data
      },
    ],
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
        const userId = new ID(req.user.id)
        const newStatus = (data.status as ThingStatus) || thing.status

        // Non-owner requesting to borrow
        if (!thing.isOwnedBy(userId)) {
          if (newStatus !== ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
            throw new Error('You can only request to borrow items that are available')
          }

          const borrowRequestRepo = new PayloadBorrowRequestRepository(req.payload)
          const thingService = new ThingService(borrowRequestRepo)
          await thingService.requestBorrow(thing, userId, new ID(originalDoc.id))

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
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // --- Notification logic (delegated to domain service) ---
        if (operation === 'update' && previousDoc) {
          const ownerId =
            typeof doc.offeredBy === 'object' ? doc.offeredBy?.id : doc.offeredBy
          const requesterId =
            typeof (doc.requestedToBorrowBy ?? previousDoc.requestedToBorrowBy) === 'object'
              ? (doc.requestedToBorrowBy ?? previousDoc.requestedToBorrowBy)?.id
              : (doc.requestedToBorrowBy ?? previousDoc.requestedToBorrowBy)

          if (ownerId) {
            const notificationService = new NotificationService(
              new PayloadNotificationRepository(req.payload),
              new PayloadPersonLookup(req.payload),
            )

            try {
              await notificationService.notifyOnStatusChange({
                itemId: new ID(doc.id),
                itemName: doc.name || 'an item',
                previousStatus: previousDoc.status as ThingStatus,
                newStatus: doc.status as ThingStatus,
                ownerId: new ID(ownerId),
                requesterId: requesterId ? new ID(requesterId) : null,
              })
            } catch (error) {
              console.error('Failed to create notification:', error)
            }
          }
        }

        // Create a Loan record when an item transitions to BORROWED
        if (
          operation === 'update' &&
          doc.status === ThingStatus.BORROWED &&
          previousDoc?.status !== ThingStatus.BORROWED
        ) {
          const borrowerId =
            typeof doc.requestedToBorrowBy === 'object'
              ? doc.requestedToBorrowBy?.id
              : doc.requestedToBorrowBy

          if (borrowerId) {
            try {
              // Calculate due date from borrowingTime (days)
              const dueDate = doc.borrowingTime
                ? new Date(Date.now() + doc.borrowingTime * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0]
                : null

              await req.payload.create({
                collection: 'loans',
                data: {
                  loan_id: uuidv4(),
                  item: doc.id,
                  borrower: borrowerId,
                  status: 'BORROWED',
                  due_date: dueDate,
                },
              })
            } catch (error) {
              console.error('Failed to create loan record:', error)
            }
          }
        }

        // When item returns to READY, mark any active loans as RETURNED
        if (
          operation === 'update' &&
          doc.status === ThingStatus.READY &&
          (previousDoc?.status === ThingStatus.BORROWED ||
            previousDoc?.status === ThingStatus.DAMAGED)
        ) {
          try {
            const activeLoans = await req.payload.find({
              collection: 'loans',
              where: {
                item: { equals: doc.id },
                status: { in: ['BORROWED', 'OVERDUE'] },
              },
            })

            for (const loan of activeLoans.docs) {
              await req.payload.update({
                collection: 'loans',
                id: loan.id,
                data: {
                  status: 'RETURNED',
                  time_returned: new Date().toISOString(),
                },
              })
            }
          } catch (error) {
            console.error('Failed to update loan records:', error)
          }
        }

        // When item is marked DAMAGED, mark any active loans as RETURNED_DAMAGED
        if (
          operation === 'update' &&
          doc.status === ThingStatus.DAMAGED &&
          previousDoc?.status === ThingStatus.BORROWED
        ) {
          try {
            const activeLoans = await req.payload.find({
              collection: 'loans',
              where: {
                item: { equals: doc.id },
                status: { in: ['BORROWED', 'OVERDUE'] },
              },
            })

            for (const loan of activeLoans.docs) {
              await req.payload.update({
                collection: 'loans',
                id: loan.id,
                data: {
                  status: 'RETURNED_DAMAGED',
                  time_returned: new Date().toISOString(),
                },
              })
            }
          } catch (error) {
            console.error('Failed to update loan records:', error)
          }
        }

        return doc
      },
    ],
  },
  timestamps: true,
}
