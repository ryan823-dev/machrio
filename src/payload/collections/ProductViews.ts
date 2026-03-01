import type { CollectionConfig } from 'payload'

/**
 * ProductViews Collection
 * Records product view events for collaborative filtering recommendations
 * ("Customers who viewed X also viewed Y")
 */
export const ProductViews: CollectionConfig = {
  slug: 'productViews',
  labels: {
    singular: '浏览记录',
    plural: '浏览记录',
  },
  admin: {
    group: '数据分析',
    useAsTitle: 'product',
    defaultColumns: ['product', 'sessionId', 'viewedAt'],
    description: 'Product view logs for recommendation engine',
  },
  // Disable versioning for performance
  versions: false,
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Anonymous session identifier (from cookie/localStorage)',
      },
    },
    {
      name: 'viewedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true,
    },
    {
      name: 'referrer',
      type: 'text',
      admin: {
        description: 'Page URL that led to this product view',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'Browser user agent string',
      },
    },
  ],
}
