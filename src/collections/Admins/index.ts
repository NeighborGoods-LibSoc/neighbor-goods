import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Admins: CollectionConfig = {
  slug: 'admins',
  access: {
    admin: authenticated,
    create: () => true,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    forgotPassword: {
      // leave default: generates /admin/reset/:token
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true
    },
    {
      name: 'role',
      type: 'text'
    }
  ],
  timestamps: true,
}
