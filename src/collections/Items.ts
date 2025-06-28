import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const Items: CollectionConfig = {
  slug: 'items',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'contributed_by', 'tags', 'updatedAt'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Select tags to categorize this item',
      },
    },
    {
      name: 'contributed_by',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'primary_image',
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
  ],
  timestamps: true,
}
