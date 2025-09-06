import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    read: ({ req }) => !!req.user,          // only logged-in users can see user data
    update: ({ req }) => !!req.user,        // can refine to `req.user.id === doc.id`
    delete: ({ req }) => !!req.user,
    create: () => true                       // allow signup
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 7200, // 2 hours for regular auth tokens
    verify: false, // Set to true if you want email verification for new accounts
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes in milliseconds
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token
        const user = args?.user

        // Use the same environment variable as your frontend
        const resetURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token ?? ''}`

        console.log('Generated reset URL:', resetURL) // Debug log
        console.log('Token:', token) // Debug log

        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
          </head>
          <body>
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Password Reset Requested</h2>
              <p>Hello ${user.name || user.email},</p>
              <p>We received a request to reset the password for <strong>${user.email}</strong>.</p>
              <p style="margin: 30px 0;">
                <a href="${resetURL}"
                   style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  Reset Your Password
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                This link will expire in 1 hour. If you did not request this password reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetURL}">${resetURL}</a>
              </p>
            </div>
          </body>
          </html>
        `
      },
      generateEmailSubject: () => {
        return `Password Reset Request`
      }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    // The email field is automatically added by Payload when auth is enabled
    // But you can customize it if needed:
    // {
    //   name: 'email',
    //   type: 'email',
    //   required: true,
    //   unique: true,
    // }
  ],
  timestamps: true,
}
