import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { slugField, uuidField } from '@/fields'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    uuidField({ name: 'category_id', label: 'Category ID', description: 'UUID for this category' }),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField(),
  ],
}
