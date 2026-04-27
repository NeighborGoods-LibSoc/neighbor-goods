import type { CollectionConfig, Access } from 'payload'
import type { User } from '@/payload-types'

import { authenticated, anyone, isOwner } from '@/access'
import { uuidField } from '@/fields'
import { ThingStatus, ID, BorrowerVerificationFlags, ThingService } from '@/domain'
import { PayloadBorrowRequestRepository } from '@/infrastructure/repositories'
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
    uuidField({ name: 'id', label: 'ID', description: 'UUID for this item' }),
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
      required: true,
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
          await thingService.requestBorrow(thing, userId)

          return thingToPayloadData(thing, originalDoc)
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
          requestedToBorrowBy: thing.requestedToBorrowBy?.toString() || null,
        }
        const updatedThing = buildDomainThingFromData(mergedData)

        return thingToPayloadData(updatedThing, mergedData)
      },
    ],
  },
  timestamps: true,
}
