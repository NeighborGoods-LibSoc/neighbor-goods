// storage-adapter-import-placeholder
import dotenv from 'dotenv';
import { mongooseAdapter } from '@payloadcms/db-mongodb'

dotenv.config(); // ensure env vars are loaded when config is imported

const disableEmailForTests = process.env.DISABLE_EMAIL_FOR_TESTS === 'true';

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { fileURLToPath } from 'url'
import { openapi, swaggerUI } from 'payload-oapi'

import { Categories } from './collections/Categories'
import { Items } from './collections/Items'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Admins } from './collections/Admins'
import { Loans } from './collections/Loans'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Admins.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  collections: [Pages, Posts, Media, Categories, Users, Admins, Items, Loans, Tags],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    openapi({ openapiVersion: '3.0', metadata: { title: 'NeighborGoods API', version: '0.0.1' } }),
    swaggerUI({ specEndpoint: '/openapi.json', enabled: true }),
    // storage-adapter-placeholder
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
  email: disableEmailForTests
    ? undefined
    : {
        transportOptions: {
          host: process.env.SMTP_HOST || '127.0.0.1',
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASS
              ? {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS,
                }
              : undefined,
        },
        fromName: process.env.SMTP_FROM_NAME || 'NeighborGoods',
        fromAddress: process.env.SMTP_FROM_ADDRESS || 'no-reply@example.com',
      },
})
