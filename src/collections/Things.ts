import type { CollectionConfig, Access } from 'payload'
import type { User } from '@/payload-types'

import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
import { isOwner } from '@/access/isOwner'
import { uuidField } from '@/fields/uuid'
import { ThingStatus, ID, ThingService, BorrowerVerificationFlags, NotificationService, InvalidThingStatusToBorrowError, BorrowCooldownError } from '@/domain'
import { APIError } from 'payload'
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
    uuidField({ name: 'owner_uuid', description: 'UUID of the owner (domain ID)', required: false }),
    uuidField({ name: 'requested_by_uuid', description: 'UUID of the user who requested to borrow (domain ID)', required: false }),
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
      name: 'borrowerVerification',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Email', value: 'EMAIL' },
        { label: 'Phone Number', value: 'PHONE_NUMBER' },
        { label: 'ID', value: 'ID' },
        { label: 'Deposit', value: 'DEPOSIT' },
        { label: 'In-person', value: 'IN_PERSON' },
      ],
      required: false,
      admin: {
        description: 'Verification methods required for a borrower to use this item.',
      },
    },
    {
      name: 'depositAmount',
      type: 'number',
      admin: {
        description: 'Amount of deposit required if DEPOSIT is selected.',
        condition: (data) => data?.borrowerVerification?.includes('DEPOSIT'),
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
          data.owner_uuid = (req.user as any).user_id
          return data
        }

        // UPDATE: Use domain layer
        if (!req.user) {
          throw new Error('You must be logged in to update an item')
        }

        const thing = buildDomainThingFromData(originalDoc)
        const userId = new ID((req.user as any).user_id as string)
        const newStatus = (data.status as ThingStatus) || thing.status

        // Non-owner requesting to borrow
        if (!thing.isOwnedBy(userId)) {
          if (newStatus !== ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
            throw new Error('You can only request to borrow items that are available')
          }

          // Check verification requirements
          const userFlags = (req.user && 'verificationFlags' in req.user) ? (req.user.verificationFlags as string[]) || [] : []
          const missingFlags = thing.borrowerVerification.filter(
            (flag) => !userFlags.includes(flag as string),
          )

          if (missingFlags.length > 0) {
            throw new Error(
              `You need additional verification to borrow this item: ${missingFlags.join(', ')}`,
            )
          }

          // Check escrow balance for deposit
          if (thing.borrowerVerification.includes(BorrowerVerificationFlags.DEPOSIT)) {
            const escrowBalance = Number(req.user?.escrowBalance || 0)
            const requiredDeposit = thing.depositAmount ? thing.depositAmount.amount.toNumber() : 0
            if (escrowBalance < requiredDeposit) {
              throw new Error(
                `Insufficient escrow balance for deposit. Required: $${requiredDeposit}, Your balance: $${escrowBalance}`,
              )
            }
          }

          const borrowRequestRepo = new PayloadBorrowRequestRepository(req.payload)
          const thingService = new ThingService(borrowRequestRepo)
          try {
            await thingService.requestBorrow(thing, userId, new ID(originalDoc.item_id))
          } catch (err) {
            if (err instanceof InvalidThingStatusToBorrowError) {
              throw new APIError('This item is not available for borrowing', 409)
            }
            if (err instanceof BorrowCooldownError) {
              throw new APIError(err.message, 429)
            }
            throw err
          }

          return {
            ...thingToPayloadData(thing, originalDoc),
            requestedToBorrowBy: req.user.id,
          }
        }

        // Owner actions
        if (data.status && data.status !== thing.status) {
          const targetStatus = data.status as ThingStatus

          if (thing.status === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW) {
            if (targetStatus === ThingStatus.READY) {
              thing.rejectBorrowRequest()
            } else if (targetStatus === ThingStatus.BORROWED) {
              thing.approveBorrowRequest()
            } else if (targetStatus === ThingStatus.RESERVED) {
              thing.reserve()
            } else {
              thing.status = targetStatus
            }
          } else {
            thing.status = targetStatus
          }
        }

        const mergedData = {
          ...originalDoc,
          ...data,
          status: thing.status,
          requested_by_uuid: thing.requestedToBorrowBy?.toString() || null,
        }
        const updatedThing = buildDomainThingFromData(mergedData)

        return thingToPayloadData(updatedThing, mergedData)
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // --- Notification logic (delegated to domain service) ---
        if (operation === 'update' && previousDoc) {
          const ownerUuid = doc.owner_uuid
          const requesterUuid = doc.requested_by_uuid ?? previousDoc.requested_by_uuid

          if (ownerUuid) {
            const notificationService = new NotificationService(
              new PayloadNotificationRepository(req.payload),
              new PayloadPersonLookup(req.payload),
            )

            // Defer via setImmediate to avoid Mongoose connection deadlock inside afterChange
            setImmediate(() => {
              notificationService.notifyOnStatusChange({
                itemId: new ID(doc.item_id),
                itemName: doc.name || 'an item',
                previousStatus: previousDoc.status as ThingStatus,
                newStatus: doc.status as ThingStatus,
                ownerId: new ID(ownerUuid),
                requesterId: requesterUuid ? new ID(requesterUuid) : null,
              }).catch((error) => {
                console.error('Failed to create notification:', error)
              })
            })
          }
        }

        // Create a Loan record when an item transitions to BORROWED
        // Deferred via setImmediate to avoid Mongoose connection deadlock inside afterChange
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
            const dueDate = doc.borrowingTime
              ? new Date(Date.now() + doc.borrowingTime * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0]
              : null
            const loanId = uuidv4()
            const itemId = doc.id
            setImmediate(() => {
              req.payload.create({
                collection: 'loans',
                data: {
                  loan_id: loanId,
                  item: itemId,
                  borrower: borrowerId,
                  status: 'BORROWED',
                  due_date: dueDate,
                },
              }).catch((error: unknown) => {
                console.error('Failed to create loan record:', error)
              })
            })
          }
        }

        // When item returns to READY, mark any active loans as RETURNED
        // Deferred via setImmediate to avoid Mongoose connection deadlock inside afterChange
        if (
          operation === 'update' &&
          doc.status === ThingStatus.READY &&
          (previousDoc?.status === ThingStatus.BORROWED ||
            previousDoc?.status === ThingStatus.DAMAGED)
        ) {
          const itemId = doc.id
          setImmediate(() => {
            req.payload.find({
              collection: 'loans',
              where: { item: { equals: itemId }, status: { in: ['BORROWED', 'OVERDUE'] } },
            }).then((activeLoans) =>
              Promise.all(activeLoans.docs.map((loan) =>
                req.payload.update({
                  collection: 'loans',
                  id: loan.id,
                  data: { status: 'RETURNED', time_returned: new Date().toISOString() },
                })
              ))
            ).catch((error: unknown) => {
              console.error('Failed to update loan records:', error)
            })
          })
        }

        // When item is marked DAMAGED, mark any active loans as RETURNED_DAMAGED
        // Deferred via setImmediate to avoid Mongoose connection deadlock inside afterChange
        if (
          operation === 'update' &&
          doc.status === ThingStatus.DAMAGED &&
          previousDoc?.status === ThingStatus.BORROWED
        ) {
          const itemId = doc.id
          setImmediate(() => {
            req.payload.find({
              collection: 'loans',
              where: { item: { equals: itemId }, status: { in: ['BORROWED', 'OVERDUE'] } },
            }).then((activeLoans) =>
              Promise.all(activeLoans.docs.map((loan) =>
                req.payload.update({
                  collection: 'loans',
                  id: loan.id,
                  data: { status: 'RETURNED_DAMAGED', time_returned: new Date().toISOString() },
                })
              ))
            ).catch((error: unknown) => {
              console.error('Failed to update loan records on damage:', error)
            })
          })
        }

        return doc
      },
    ],
  },
  timestamps: true,
}
