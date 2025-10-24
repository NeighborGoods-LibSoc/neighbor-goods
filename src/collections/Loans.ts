import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

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
    {
      name: 'loan_id',
      type: 'text',
      required: true,
      admin: {
        description: 'UUID for the loan (domain ID)',
      },
      validate: (val: unknown) => {
        if (typeof val !== 'string') return 'Must be a string'
        // simple UUID v4 format check (relaxed)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(val) || 'Must be a valid UUID'
      },
    },
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
      async ({ data, req }) => {
        if (!data) return data
        try {
          // Build domain object and write normalized values back to data
          const domainLoan = await buildDomainLoanFromData(data, req)
          // Normalize status (may auto-transition to OVERDUE based on due_date)
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
          // Normalize return_location/time_returned if needed (no change necessary)
          return data
        } catch (e: any) {
          throw new Error(e?.message || 'Invalid Loan domain state')
        }
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        if (!data) return data
        try {
          const domainLoan = await buildDomainLoanFromData(data, req)
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

// --- Domain mapping helpers ---
import { Loan } from '@/domain/entities/loan'
import { Thing } from '@/domain/entities/thing'
import { ID, DueDate, LoanStatus } from '@/domain/valueItems'
import { PhysicalLocation } from '@/domain/valueItems/location/physical_location'
import { ThingTitle } from '@/domain/valueItems/thingTitle'
import { mapItemToThing, mapReturnLocation } from '@/collections/common/mappers'

async function buildDomainLoanFromData(data: any, req: any): Promise<Loan> {
  const loan_id = new ID(String(data.loan_id))

  const itemId = typeof data.item === 'object' ? data.item?.id || data.item?.value : data.item
  if (!itemId) throw new Error('Item is required')
  const itemDoc: any = await req.payload.findByID({ collection: 'items', id: String(itemId) })

  const thing = mapItemToThing(itemDoc)

  const borrowerId = typeof data.borrower === 'object' ? data.borrower?.id || data.borrower?.value : data.borrower
  if (!borrowerId) throw new Error('Borrower is required')
  const borrower_id = new ID(String(borrowerId))

  const due_date = data.due_date ? DueDate.of(new Date(data.due_date)) : DueDate.of(null)

  const return_location = mapReturnLocation(data.return_location)
  const time_returned = data.time_returned ? new Date(data.time_returned) : null

  const loan = new Loan({
    loan_id,
    item: thing,
    due_date,
    borrower_id,
    return_location: return_location as any,
    time_returned,
  })

  // Apply the requested status through domain rules
  const desired = String(data.status || 'RETURNED') as keyof typeof LoanStatus
  if (!(desired in LoanStatus)) {
    throw new Error(`Invalid status '${data.status}'`)
  }
  // set may throw if transition invalid
  loan.status = LoanStatus[desired]

  return loan
}


