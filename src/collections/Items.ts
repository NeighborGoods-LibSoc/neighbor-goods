import type { CollectionConfig, Access } from 'payload'
import type { User } from '@/payload-types'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { isOwner } from '../access/isOwner'
import { ThingStatus } from '../domain/valueItems/thingStatus'
import statusTransitions from '../domain/valueItems/statusTransitions.json'

// 1 hour cooldown in milliseconds
const BORROW_REQUEST_COOLDOWN_MS = 60 * 60 * 1000

/**
 * Custom access control for item updates:
 * - Owner can always update
 * - Non-owners can update ONLY to request borrowing (READY -> WAITING_FOR_LENDER_APPROVAL_TO_BORROW)
 */
const canUpdateItem: Access<User> = async ({ req: { user, payload }, id }) => {
  if (!user) return false
  if (!id) return true // Create operation handled separately

  // First check if user is owner - if so, allow all updates
  const ownerAccess = isOwner('offeredBy')
  const ownerResult = ownerAccess({ req: { user, payload }, id } as any)

  // If owner check returns a query, we need to verify ownership
  if (typeof ownerResult === 'object') {
    // Return the owner query - Payload will handle it
    // But we also need to allow non-owners for borrow requests
    // So we return true and handle validation in beforeChange hook
    return true
  }

  return ownerResult
}

export const Items: CollectionConfig = {
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

        // On create, force offeredBy to be the authenticated user (prevent spoofing)
        if (operation === 'create') {
          if (!req.user) {
            throw new Error('You must be logged in to offer an item')
          }
          // Always set offeredBy to the authenticated user, ignoring client input
          data.offeredBy = req.user.id
          return data
        }

        // Get owner ID for checks
        const originalOwnerId = originalDoc?.offeredBy
          ? typeof originalDoc.offeredBy === 'object'
            ? originalDoc.offeredBy.id
            : originalDoc.offeredBy
          : null

        const isOwner = req.user && originalOwnerId === req.user.id
        const currentStatus = originalDoc?.status || ThingStatus.READY
        const newStatus = data.status || currentStatus

        // --- Handle borrow request from non-owner ---
        if (!isOwner && req.user) {
          // Non-owners can ONLY request to borrow (READY -> WAITING_FOR_LENDER_APPROVAL_TO_BORROW)
          const isRequestingToBorrow =
            currentStatus === ThingStatus.READY &&
            newStatus === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW

          if (!isRequestingToBorrow) {
            throw new Error('You can only request to borrow items that are available')
          }

          // Check cooldown for this user-item combination
          const existingRequest = await req.payload.find({
            collection: 'borrow-requests',
            where: {
              and: [
                { item: { equals: originalDoc.id } },
                { requestedBy: { equals: req.user.id } },
              ],
            },
            limit: 1,
          })

          const existingRequestDoc = existingRequest.docs[0]
          if (existingRequestDoc) {
            const lastRequestTime = new Date(existingRequestDoc.requestedAt).getTime()
            const timeSinceLastRequest = Date.now() - lastRequestTime

            if (timeSinceLastRequest < BORROW_REQUEST_COOLDOWN_MS) {
              const minutesRemaining = Math.ceil(
                (BORROW_REQUEST_COOLDOWN_MS - timeSinceLastRequest) / 60000
              )
              throw new Error(
                `You must wait ${minutesRemaining} minute(s) before requesting to borrow this item again`
              )
            }

            // Update the existing request timestamp
            await req.payload.update({
              collection: 'borrow-requests',
              id: existingRequestDoc.id,
              data: {
                requestedAt: new Date().toISOString(),
              },
            })
          } else {
            // Create new borrow request record
            await req.payload.create({
              collection: 'borrow-requests',
              data: {
                item: originalDoc.id,
                requestedBy: req.user.id,
                requestedAt: new Date().toISOString(),
              },
            })
          }

          // Set the requestedToBorrowBy field to the requesting user
          data.requestedToBorrowBy = req.user.id

          // Ensure non-owner cannot change other fields
          data.name = originalDoc.name
          data.description = originalDoc.description
          data.tags = originalDoc.tags
          data.rulesForUse = originalDoc.rulesForUse
          data.borrowingTime = originalDoc.borrowingTime
          data.offeredBy = originalOwnerId
          data.primaryImage = originalDoc.primaryImage
          data.additional_images = originalDoc.additional_images

          return data
        }

        // --- Owner updates ---
        // Preserve original owner, ignore any attempt to change it
        if (originalOwnerId) {
          data.offeredBy = originalOwnerId
        }

        // If owner is rejecting a borrow request (WAITING -> READY), clear the requester
        if (
          currentStatus === ThingStatus.WAITING_FOR_LENDER_APPROVAL_TO_BORROW &&
          newStatus === ThingStatus.READY
        ) {
          data.requestedToBorrowBy = null
        }

        // If owner is approving (WAITING -> RESERVED or BORROWED), keep requester for reference
        // The requester info can be used later when creating a loan

        // Validate status transition using shared config
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
