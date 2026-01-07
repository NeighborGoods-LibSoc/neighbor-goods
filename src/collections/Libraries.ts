import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { SimpleLibrary } from '@/domain/entities/libraries/simpleLibrary'
import { ID, Money, Currency, WaitingListType } from '@/domain/valueItems'
import { MOPServer } from '@/domain/entities/mopServer'
import { URL } from '@/domain/valueItems/url'
import {
  mapReturnLocation,
  mapUserToPerson,
  mapDataToMoney,
  mapDataToMopServer,
  mapItemToThing,
} from '@/collections/common/mappers'

export const Libraries: CollectionConfig = {
  slug: 'libraries',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'library_id', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'library_id',
      type: 'text',
      required: true,
      admin: {
        description: 'UUID for the library (domain ID)',
      },
      validate: (val: unknown) => {
        if (typeof val !== 'string') return 'Must be a string'
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(val) || 'Must be a valid UUID'
      },
    },
    {
      name: 'location',
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
      name: 'administrators',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: true,
    },
    {
      name: 'waitingListType',
      type: 'select',
      defaultValue: 'NONE',
      options: [
        { label: 'None', value: 'NONE' },
        { label: 'Quadratic Waiting List', value: 'QUADRATIC_WAITING_LIST' },
        { label: 'First Come First Serve', value: 'FIRST_COME_FIRST_SERVE' },
      ],
      required: true,
    },
    {
      name: 'maxFinesBeforeSuspension',
      type: 'group',
      fields: [
        { name: 'amount', type: 'number', required: true, defaultValue: 0 },
        {
          name: 'currency',
          type: 'select',
          required: true,
          defaultValue: 'USD',
          options: [
            { label: 'US Dollar', value: 'USD' },
            { label: 'Euro', value: 'EUR' },
            { label: 'Labor Token', value: 'HOUR' },
          ],
        },
      ],
    },
    {
      name: 'feeSchedule',
      type: 'group',
      fields: [
        {
          name: 'feeForOverdueItem',
          type: 'group',
          fields: [
            { name: 'amount', type: 'number', required: true, defaultValue: 0 },
            {
              name: 'currency',
              type: 'select',
              required: true,
              defaultValue: 'USD',
              options: [
                { label: 'US Dollar', value: 'USD' },
                { label: 'Euro', value: 'EUR' },
                { label: 'Labor Token', value: 'HOUR' },
              ],
            },
          ],
        },
        {
          name: 'feeForDamagedItem',
          type: 'group',
          fields: [
            { name: 'amount', type: 'number', required: true, defaultValue: 0 },
            {
              name: 'currency',
              type: 'select',
              required: true,
              defaultValue: 'USD',
              options: [
                { label: 'US Dollar', value: 'USD' },
                { label: 'Euro', value: 'EUR' },
                { label: 'Labor Token', value: 'HOUR' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'defaultLoanTime',
      type: 'number',
      required: true,
      defaultValue: 14,
      admin: {
        description: 'Default loan time in days',
      },
    },
    {
      name: 'mopServer',
      type: 'group',
      fields: [
        { name: 'url', type: 'text', required: true, defaultValue: 'https://localhost' },
        { name: 'version', type: 'text', required: true, defaultValue: '0.0.0' },
      ],
    },
    {
      name: 'publicURL',
      type: 'text',
      required: false,
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'items',
      hasMany: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data
        try {
          const domainLibrary = await buildDomainLibraryFromData(data, req)
          data.library_id = domainLibrary.libraryID.toString()
          return data
        } catch (e: any) {
          throw new Error(e?.message || 'Invalid Library domain state')
        }
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        if (!data) return data
        try {
          const domainLibrary = await buildDomainLibraryFromData(data, req)
          data.library_id = domainLibrary.libraryID.toString()
          return data
        } catch (e: any) {
          throw new Error(e?.message || 'Invalid Library domain state')
        }
      },
    ],
  },
  timestamps: true,
}

async function buildDomainLibraryFromData(data: any, req: any): Promise<SimpleLibrary> {
  const libraryID = new ID(String(data.library_id || ID.generate()))

  const adminIds = Array.isArray(data.administrators) ? data.administrators : [data.administrators].filter(Boolean)
  const administrators: any[] = []
  for (const adminId of adminIds) {
    const id = typeof adminId === 'object' ? adminId?.id || adminId?.value : adminId
    const userDoc = await req.payload.findByID({ collection: 'users', id: String(id) })
    administrators.push(mapUserToPerson(userDoc))
  }

  const mopServer = mapDataToMopServer(data.mopServer)
  const maxFinesBeforeSuspension = mapDataToMoney(data.maxFinesBeforeSuspension)

  // Simple fee schedule mapping
  const feeSchedule = {
    feeForOverdueItem: () => mapDataToMoney(data.feeSchedule?.feeForOverdueItem),
    feeForDamagedItem: () => mapDataToMoney(data.feeSchedule?.feeForDamagedItem),
  }

  const library = new SimpleLibrary({
    libraryID,
    name: data.name || 'Unnamed Library',
    administrators,
    waitingListType: (data.waitingListType as WaitingListType) || WaitingListType.NONE,
    maxFinesBeforeSuspension,
    feeSchedule: feeSchedule as any,
    defaultLoanTime: { days: Number(data.defaultLoanTime || 14) },
    mopServer,
    publicURL: data.publicURL ? URL.parse(data.publicURL) : null,
  })

  if (data.location) {
    library.location = mapReturnLocation(data.location) as any
  }

  if (data.items) {
    const itemIds = Array.isArray(data.items) ? data.items : [data.items]
    for (const itemId of itemIds) {
      const id = typeof itemId === 'object' ? itemId?.id || itemId?.value : itemId
      const itemDoc = await req.payload.findByID({ collection: 'items', id: String(id) })
      library.addItem(mapItemToThing(itemDoc))
    }
  }

  return library
}
