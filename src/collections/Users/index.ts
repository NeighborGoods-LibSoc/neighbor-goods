import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    read: ({ req }) => !!req.user,          // only logged-in users can see user data
    update: ({ req }) => !!req.user,        // can refine to `req.user.id === doc.id`
    delete: ({ req }) => !!req.user,
    create: () => true                                        // allow signup
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token
        const resetURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token ?? ''}`

        return `
        <h2>Password Reset Requested</h2>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetURL}">Click here to reset your password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
