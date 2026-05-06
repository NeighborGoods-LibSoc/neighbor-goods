import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { uuidField } from '@/fields'

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
    uuidField({ name: 'admin_id', label: 'Admin ID', description: 'UUID for this admin' }),
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
