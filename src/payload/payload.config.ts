import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { zh } from '@payloadcms/translations/languages/zh'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Brands } from './collections/Brands'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { BankAccounts } from './collections/BankAccounts'
import { RFQSubmissions } from './collections/RFQSubmissions'
import { ContactSubmissions } from './collections/ContactSubmissions'
import { ShippingMethods } from './collections/ShippingMethods'
import { ShippingRates } from './collections/ShippingRates'
import { FreeShippingRules } from './collections/FreeShippingRules'
import { Users } from './collections/Users'
import { VerificationCodes } from './collections/VerificationCodes'
import { AccountSessions } from './collections/AccountSessions'
import { ProductViews } from './collections/ProductViews'
import { Articles } from './collections/Articles'
import { Customers } from './collections/Customers'
import { Quotes } from './collections/Quotes'
import { Pages } from './collections/Pages'
import { Industries } from './collections/Industries'
import { Redirects } from './collections/Redirects'
import { GlossaryTerms } from './collections/GlossaryTerms'

import { Homepage } from './globals/Homepage'
import { SiteSettings } from './globals/SiteSettings'
import { Navigation } from './globals/Navigation'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  sharp,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Machrio Admin',
    },
    components: {
      graphics: {
        Logo: '/src/components/admin/Logo#Logo',
        Icon: '/src/components/admin/Icon#Icon',
      },
      views: {
        bulkImport: {
          Component: '/src/components/admin/BulkImportView#BulkImportView',
          path: '/bulk-import',
          exact: true,
        },
      },
    },
  },
  i18n: {
    supportedLanguages: { zh, en },
    fallbackLanguage: 'en',
  },
  collections: [
    Users,
    Categories,
    Products,
    Brands,
    Media,
    Orders,
    Customers,
    Quotes,
    BankAccounts,
    RFQSubmissions,
    ContactSubmissions,
    ShippingMethods,
    ShippingRates,
    FreeShippingRules,
    VerificationCodes,
    AccountSessions,
    ProductViews,
    Articles,
    Pages,
    Industries,
    Redirects,
    GlossaryTerms,
  ],
  globals: [
    Homepage,
    SiteSettings,
    Navigation,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/machrio',
  }),
  plugins: [
    // Vercel Blob Storage for production
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            collections: {
              media: true,
            },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],
})
