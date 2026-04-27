import type { CollectionConfig } from 'payload'

import { authenticated, anyone } from '@/access'
import { uuidField } from '@/fields'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    uuidField({ name: 'id', label: 'ID', description: 'UUID for this tag' }),
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Tag name (e.g., "Electronics", "Books", "Clothing")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description of what this tag represents',
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code for tag display (e.g., "#FF5733")',
      },
    },
  ],
  timestamps: true,
}
