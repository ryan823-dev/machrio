import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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

// 使用 PostgreSQL 作为默认数据库（迁移后不再支持 MongoDB）
const usePostgres = process.env.USE_POSTGRES !== '0' && !!process.env.DATABASE_URI

export default buildConfig({
  sharp,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Machrio Admin',
    },
    // 简化 admin 配置，加快加载
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
    // 禁用不需要的功能
    disable: {
      // 保留数据，可以稍后清理
      dataLoader: false,
    },
  },
  // 保留 i18n 但可以精简
  i18n: {
    supportedLanguages: { en }, // 只保留英文
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
  // 简化编辑器
  editor: lexicalEditor({
    features: ({ rootFeatures }) => rootFeatures,
  }),
  secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Database
  db: usePostgres
    ? postgresAdapter({
        pool: {
          connectionString: process.env.DATABASE_URI!,
          max: 1,
          min: 0,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 30000,
        },
      })
    : undefined,
  // 简化 plugins
  plugins: [],
})
