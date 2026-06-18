import type { CollectionConfig } from 'payload'

import { hasServerAdminPrivileges } from '@/utilities/isServerAdmin'
import { uuidField } from '@/fields'

export const Admins: CollectionConfig = {
  slug: 'admins',
  access: {
    admin: ({ req }) => hasServerAdminPrivileges(req, false),
    create: ({ req }) => hasServerAdminPrivileges(req, true),
    delete: ({ req }) => hasServerAdminPrivileges(req, true),
    read: ({ req }) => hasServerAdminPrivileges(req, true),
    update: ({ req }) => hasServerAdminPrivileges(req, true),
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
