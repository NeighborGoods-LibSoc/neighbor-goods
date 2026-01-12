import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { uuidField } from '@/fields/uuid'
import { buildDomainDistributedLibraryFromData, serializeArea } from '@/collections/common/mappers'

export const DistributedLibraries: CollectionConfig = {
  slug: 'distributedLibraries',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['library_id', 'name', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    uuidField({ name: 'library_id', description: 'UUID for the library (domain ID)' }),
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'public_url',
      type: 'text',
      required: false,
      admin: { description: 'Public URL for this distributed library' },
    },
    {
      name: 'administrators',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: false,
    },
    {
      name: 'default_loan_time_days',
      type: 'number',
      required: true,
      defaultValue: 14,
      admin: { description: 'Default loan time in days' },
    },
    {
      name: 'area',
      type: 'group',
      admin: { description: 'Geographic service area' },
      fields: [
        {
          name: 'center_point',
          type: 'group',
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
          name: 'radius_kilometers',
          type: 'number',
          required: true,
          defaultValue: 10,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data
        try {
          const domainDL = buildDomainDistributedLibraryFromData(data)
          // write back normalized values
          data.library_id = domainDL.libraryID.toString()
          data.name = String(domainDL.name)
          data.default_loan_time_days = Math.max(1, Number(data.default_loan_time_days ?? domainDL.defaultLoanTime.days))
          data.public_url = domainDL.publicURL ? String(domainDL.publicURL) : undefined
          // area normalization
          if (domainDL.area) {
            data.area = serializeArea(domainDL)
          }
          return data
        } catch (e: any) {
          throw new Error(e?.message || 'Invalid DistributedLibrary domain state')
        }
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        if (!data) return data
        try {
          const domainDL = buildDomainDistributedLibraryFromData(data)
          // write back normalized values again
          data.library_id = domainDL.libraryID.toString()
          data.name = String(domainDL.name)
          data.default_loan_time_days = Math.max(1, Number(data.default_loan_time_days ?? domainDL.defaultLoanTime.days))
          data.public_url = domainDL.publicURL ? String(domainDL.publicURL) : undefined
          if (domainDL.area) {
            data.area = serializeArea(domainDL)
          }
          return data
        } catch (e: any) {
          throw new Error(e?.message || 'Invalid DistributedLibrary domain state')
        }
      },
    ],
    afterRead: [
      async ({ doc }) => {
        try {
          const domainDL = buildDomainDistributedLibraryFromData(doc)
          // reflect any normalization
          if (doc.library_id !== domainDL.libraryID.toString()) doc.library_id = domainDL.libraryID.toString()
          if (doc.name !== domainDL.name) doc.name = domainDL.name
          const normalizedURL = domainDL.publicURL ? String(domainDL.publicURL) : undefined
          if (doc.public_url !== normalizedURL) doc.public_url = normalizedURL
          const normalizedDays = Math.max(1, Number(doc.default_loan_time_days ?? domainDL.defaultLoanTime.days))
          if (doc.default_loan_time_days !== normalizedDays) doc.default_loan_time_days = normalizedDays
          if (domainDL.area) {
            doc.area = serializeArea(domainDL)
          }
        } catch {}
        return doc
      },
    ],
  },
  timestamps: true,
}
