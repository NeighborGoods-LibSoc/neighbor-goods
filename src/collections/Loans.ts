import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
import { uuidField } from '@/fields/uuid'
// --- Domain mapping helpers ---
import { Loan } from '@/domain/entities/loan'
import { DueDate, ID, LoanStatus, ReturnInitiator } from '@/domain/valueItems'
import {
  mapItemToThing,
  mapReturnLocation,
  buildDomainDistributedLibraryFromData,
} from '@/collections/common/mappers'

export const Loans: CollectionConfig = {
  slug: 'loans',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['loan_id', 'item', 'borrower', 'status', 'due_date', 'updatedAt'],
    useAsTitle: 'loan_id',
  },
  fields: [
    uuidField({ name: 'loan_id', description: 'UUID for the loan (domain ID)' }),
    {
      name: 'item',
      type: 'relationship',
      relationTo: 'items',
      required: true,
    },
    {
      name: 'borrower',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'due_date',
      type: 'date',
      required: false,
      admin: {
        description: 'Due date for returning the item (no time component)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'RETURNED',
      options: [
        { label: 'Borrowed', value: 'BORROWED' },
        { label: 'Overdue', value: 'OVERDUE' },
        { label: 'Return Started', value: 'RETURN_STARTED' },
        { label: 'Waiting on Lender Acceptance', value: 'WAITING_ON_LENDER_ACCEPTANCE' },
        { label: 'Returned Damaged', value: 'RETURNED_DAMAGED' },
        { label: 'Returned', value: 'RETURNED' },
      ],
    },
    {
      name: 'return_location',
      type: 'group',
      admin: { description: 'Where the item was returned (if applicable)' },
      fields: [
        { name: 'latitude', type: 'number', required: false },
        { name: 'longitude', type: 'number', required: false },
        { name: 'street_address', type: 'text', required: false },
        { name: 'city', type: 'text', required: false },
        { name: 'state', type: 'text', required: false },
        { name: 'zip_code', type: 'text', required: false },
        { name: 'country', type: 'text', required: false },
      ],
    },
    {
      name: 'time_returned',
      type: 'date',
      admin: { description: 'Timestamp when the item was returned' },
      required: false,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc, operation }) => {
        if (!data) return data
        try {
          // For updates, merge data with originalDoc to build complete domain object
          const mergedData = operation === 'update' ? { ...originalDoc, ...data } : data
          const domainLoan = await buildDomainLoanFromData(mergedData, req)
          // Normalize status
          data.status = domainLoan.status
          // Ensure loan_id remains consistent
          data.loan_id = domainLoan.loanID.toString()
          // Normalize due_date to ISO date (YYYY-MM-DD) if present
          if (domainLoan.dueDate?.date) {
            const d = domainLoan.dueDate.date
            const yyyy = d.getUTCFullYear()
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
            const dd = String(d.getUTCDate()).padStart(2, '0')
            data.due_date = `${yyyy}-${mm}-${dd}`
          }
          return data
        } catch (e: any) {
          throw new Error(e?.message || 'Invalid Loan domain state')
        }
      },
    ],
    beforeChange: [
      async ({ data, req, originalDoc, operation }) => {
        if (!data) return data
        try {
          const mergedData = operation === 'update' ? { ...originalDoc, ...data } : data

          // Enforce returnInitiator permission on the BORROWED -> RETURN_STARTED transition.
          // Business rule lives in the domain Library; the hook simply consults it.
          if (
            operation === 'update' &&
            originalDoc?.status === 'BORROWED' &&
            data.status === 'RETURN_STARTED'
          ) {
            await enforceReturnInitiator(mergedData, req)
          }

          const domainLoan = await buildDomainLoanFromData(mergedData, req)
          // write back normalized values again
          data.status = domainLoan.status
          data.loan_id = domainLoan.loanID.toString()
          return data
        } catch (e: any) {
          throw new Error(e?.message || 'Invalid Loan domain state')
        }
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        // Attempt to compute domain status on read for consistency
        try {
          const domainLoan = await buildDomainLoanFromData(doc, req)
          // reflect any automatic transitions (e.g., OVERDUE)
          if (doc.status !== domainLoan.status) {
            doc.status = domainLoan.status
          }
        } catch {}
        return doc
      },
    ],
  },
  timestamps: true,
}

async function buildDomainLoanFromData(data: any, req: any): Promise<Loan> {
  const loan_id = new ID(String(data.loan_id))

  const itemId = typeof data.item === 'object' ? data.item?.id || data.item?.value : data.item
  if (!itemId) throw new Error('Item is required')
  const itemDoc: any = await req.payload.findByID({ collection: 'items', id: String(itemId) })

  const thing = mapItemToThing(itemDoc)

  const borrowerId =
    typeof data.borrower === 'object' ? data.borrower?.id || data.borrower?.value : data.borrower
  if (!borrowerId) throw new Error('Borrower is required')
  const borrowerDoc: any = await req.payload.findByID({ collection: 'users', id: String(borrowerId) })
  if (!borrowerDoc?.user_id) throw new Error(`User UUID not found for borrower: ${borrowerId}`)
  const borrower_id = new ID(String(borrowerDoc.user_id))

  const due_date = data.due_date ? DueDate.of(new Date(data.due_date)) : DueDate.of(null)

  const return_location = mapReturnLocation(data.return_location)
  const time_returned = data.time_returned ? new Date(data.time_returned) : null

  return new Loan({
    loanId: loan_id,
    item: thing,
    dueDate: due_date,
    borrowerId: borrower_id,
    returnLocation: return_location as any,
    timeReturned: time_returned,
    status: LoanStatus[data.status as keyof typeof LoanStatus] || LoanStatus.RETURNED,
  })
}

/**
 * Enforces that the user attempting to start the return matches the owning
 * library's `returnInitiator`. All business logic lives in the domain Library;
 * this hook only assembles the request and asks the domain who is allowed.
 */
async function enforceReturnInitiator(data: any, req: any): Promise<void> {
  const actingUser = req?.user
  if (!actingUser) throw new Error('Authentication required to start a return')

  const itemId = typeof data.item === 'object' ? data.item?.id || data.item?.value : data.item
  if (!itemId) throw new Error('Item is required')

  const itemDoc: any = await req.payload.findByID({ collection: 'items', id: String(itemId) })

  // Find the distributed library that owns this item.
  const libSearch: any = await req.payload.find({
    collection: 'distributedLibraries',
    where: { items: { in: [String(itemId)] } },
    limit: 1,
  })
  const libDoc: any = libSearch?.docs?.[0]
  if (!libDoc) {
    // No library found -> fall back to LENDER initiator (current default behavior).
    // Permit only the lender to start the return.
    assertActingUserIs('lender', actingUser, itemDoc, data)
    return
  }

  const domainLibrary = await buildDomainDistributedLibraryFromData(libDoc)
  const initiator = domainLibrary.returnInitiator

  if (initiator === ReturnInitiator.BORROWER) {
    assertActingUserIs('borrower', actingUser, itemDoc, data)
  } else {
    assertActingUserIs('lender', actingUser, itemDoc, data)
  }
}

function assertActingUserIs(
  role: 'borrower' | 'lender',
  actingUser: any,
  itemDoc: any,
  data: any,
): void {
  const actingId = String(actingUser?.id ?? '')
  if (role === 'borrower') {
    const borrowerId =
      typeof data.borrower === 'object' ? data.borrower?.id || data.borrower?.value : data.borrower
    if (!borrowerId || String(borrowerId) !== actingId) {
      throw new Error('Only the borrower can start the return for this library')
    }
  } else {
    const lenderId =
      typeof itemDoc?.offeredBy === 'object'
        ? itemDoc.offeredBy?.id
        : itemDoc?.offeredBy
    if (!lenderId || String(lenderId) !== actingId) {
      throw new Error('Only the lender can start the return for this library')
    }
  }
}


