import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  defaultSort: '-updatedAt',
  defaultLimit: 20,
  labels: {
    singular: '产品',
    plural: '产品',
  },
  admin: {
    useAsTitle: 'name',
    group: '产品目录',
    defaultColumns: ['name', 'sku', 'primaryCategory', 'status', 'updatedAt'],
    listSearchableFields: ['name', 'sku'],
    components: {
      beforeListTable: ['/src/components/admin/ProductListHeader#ProductListHeader'],
    },
  },
  // 确保分页查询稳定
  indexes: [
    {
      fields: ['-updatedAt'],
    },
    {
      fields: ['slug'],
      unique: true,
    },
  ],
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const basePrice = data?.pricing?.basePrice
        if (basePrice && basePrice > 0) {
          const existing = data.pricing?.tieredPricing
          if (!existing || !Array.isArray(existing) || existing.length === 0) {
            data.pricing.tieredPricing = [
              { minQty: 1, maxQty: 9, unitPrice: Math.round(basePrice * 100) / 100 },
              { minQty: 10, maxQty: 49, unitPrice: Math.round(basePrice * 0.95 * 100) / 100 },
              { minQty: 50, unitPrice: Math.round(basePrice * 0.90 * 100) / 100 },
            ]
          }
        }
        return data
      },
    ],
  },
  fields: [
    // Sidebar fields
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-safe identifier',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              const baseSlug = data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
              const skuPart = data.sku ? `-${data.sku.toLowerCase().slice(-4)}` : ''
              return `${baseSlug}${skuPart}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Internal product code',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Discontinued', value: 'discontinued' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'purchaseMode',
      type: 'select',
      required: true,
      defaultValue: 'both',
      options: [
        { label: 'Buy Online + RFQ', value: 'both' },
        { label: 'Buy Online Only', value: 'buy-online' },
        { label: 'RFQ Only (Contact for Quote)', value: 'rfq-only' },
      ],
      admin: {
        position: 'sidebar',
        description: 'How customers can purchase',
      },
    },

    // TABS
    {
      type: 'tabs',
      tabs: [
        // ==================== Tab 1: Basic Info ====================
        {
          label: '基本信息',
          description: 'Product identity and descriptions',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Full product name',
              },
            },
            {
              name: 'shortName',
              type: 'text',
              admin: {
                description: 'Short name for listings (optional)',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'primaryCategory',
                  type: 'relationship',
                  relationTo: 'categories',
                  required: true,
                  admin: {
                    width: '50%',
                    description: 'Main category (used in URL)',
                  },
                },
                {
                  name: 'brand',
                  type: 'relationship',
                  relationTo: 'brands',
                  admin: {
                    width: '50%',
                    description: 'Product brand (optional)',
                  },
                },
              ],
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                description: 'Additional categories',
              },
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Brief description (50+ words, used for meta description)',
              },
            },
            {
              name: 'industries',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Manufacturing', value: 'manufacturing' },
                { label: 'Construction', value: 'construction' },
                { label: 'Automotive', value: 'automotive' },
                { label: 'Healthcare', value: 'healthcare' },
                { label: 'Food & Beverage', value: 'food-beverage' },
                { label: 'Warehouse & Logistics', value: 'warehouse' },
                { label: 'Oil & Gas', value: 'oil-gas' },
                { label: 'Mining', value: 'mining' },
              ],
            },
          ],
        },

        // ==================== Tab 2: Pricing & Inventory ====================
        {
          label: '定价库存',
          description: 'Pricing tiers and availability',
          fields: [
            {
              name: 'pricing',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'costPrice',
                      type: 'number',
                      admin: {
                        width: '25%',
                        description: 'Cost price (for margin calculation)',
                      },
                    },
                    {
                      name: 'basePrice',
                      type: 'number',
                      admin: {
                        width: '25%',
                        description: 'Selling price (leave empty for RFQ-only)',
                      },
                    },
                    {
                      name: 'compareAtPrice',
                      type: 'number',
                      admin: {
                        width: '25%',
                        description: 'Original price (strikethrough)',
                      },
                    },
                    {
                      name: 'currency',
                      type: 'select',
                      defaultValue: 'USD',
                      options: [
                        { label: 'USD', value: 'USD' },
                        { label: 'CAD', value: 'CAD' },
                      ],
                      admin: {
                        width: '25%',
                      },
                    },
                  ],
                },
                {
                  name: 'priceUnit',
                  type: 'text',
                  admin: {
                    description: 'e.g., per piece, per box, per 100',
                  },
                },
                {
                  name: 'tieredPricing',
                  type: 'array',
                  admin: {
                    description: 'Volume discount tiers (auto-generated if empty)',
                  },
                  fields: [
                    {
                      name: 'minQty',
                      type: 'number',
                      required: true,
                      admin: { description: 'Min qty', width: '33%' },
                    },
                    {
                      name: 'maxQty',
                      type: 'number',
                      admin: { description: 'Max qty', width: '33%' },
                    },
                    {
                      name: 'unitPrice',
                      type: 'number',
                      required: true,
                      admin: { description: 'Unit price', width: '33%' },
                    },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'availability',
                  type: 'select',
                  required: true,
                  defaultValue: 'contact',
                  options: [
                    { label: 'In Stock', value: 'in-stock' },
                    { label: 'Made to Order', value: 'made-to-order' },
                    { label: 'Contact for Availability', value: 'contact' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'leadTime',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'e.g., 2-3 weeks, Ships in 1 day',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'minOrderQuantity',
                  type: 'number',
                  admin: {
                    width: '33%',
                    description: 'Minimum order qty',
                  },
                },
                {
                  name: 'packageQty',
                  type: 'number',
                  admin: {
                    width: '33%',
                    description: 'Units per package',
                  },
                },
                {
                  name: 'packageUnit',
                  type: 'text',
                  admin: {
                    width: '33%',
                    description: 'e.g., box, case, roll',
                  },
                },
              ],
            },
            {
              name: 'shippingInfo',
              type: 'group',
              admin: { description: 'Shipping weight and processing' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'weight',
                      type: 'number',
                      min: 0,
                      admin: { width: '50%', description: 'Weight in kg' },
                    },
                    {
                      name: 'processingTime',
                      type: 'number',
                      min: 0,
                      defaultValue: 3,
                      admin: { width: '50%', description: 'Days to ship' },
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ==================== Tab 3: Media ====================
        {
          label: '媒体资源',
          description: 'Images and documents',
          fields: [
            // UI field for image management (no actual data storage, just UI)
            {
              name: 'imageManager',
              type: 'ui',
              admin: {
                components: {
                  Field: '/src/components/admin/ProductImageManager#ProductImageManager',
                },
              },
            },
            // Hidden fields that store the actual image URLs
            {
              name: 'externalImageUrl',
              type: 'text',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'additionalImageUrls',
              type: 'text',
              hasMany: true,
              admin: {
                hidden: true,
              },
            },
            {
              name: 'primaryImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                hidden: true,
              },
            },
            {
              name: 'datasheet',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'PDF datasheet/specification document',
              },
            },
          ],
        },

        // ==================== Tab 4: Specifications ====================
        {
          label: '规格参数',
          description: 'Technical specifications and filters',
          fields: [
            {
              name: 'specifications',
              type: 'array',
              admin: {
                description: 'Technical specifications',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { width: '40%' },
                    },
                    {
                      name: 'value',
                      type: 'text',
                      required: true,
                      admin: { width: '40%' },
                    },
                    {
                      name: 'unit',
                      type: 'text',
                      admin: { width: '20%', description: 'e.g., kg, mm' },
                    },
                  ],
                },
              ],
            },
          ],
        },

        // ==================== Tab 5: SEO & Content ====================
        {
          label: 'SEO内容',
          description: 'Full description and SEO settings',
          fields: [
            {
              name: 'fullDescription',
              type: 'richText',
              required: true,
              admin: {
                description: 'Full product description (300+ words for SEO)',
              },
            },
            {
              name: 'seo',
              type: 'group',
              admin: {
                description: 'SEO overrides',
              },
              fields: [
                {
                  name: 'metaTitle',
                  type: 'text',
                  maxLength: 60,
                  admin: {
                    description: 'Custom meta title (auto-generated if empty)',
                  },
                },
                {
                  name: 'metaDescription',
                  type: 'textarea',
                  maxLength: 160,
                  admin: {
                    description: 'Custom meta description',
                  },
                },
                {
                  name: 'focusKeyword',
                  type: 'text',
                  admin: {
                    description: 'Primary keyword for this product',
                  },
                },
              ],
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              admin: {
                description: 'Related products for cross-selling',
              },
            },
            {
              name: 'sourceUrl',
              type: 'text',
              admin: {
                description: 'Original product source URL (for tracking)',
              },
            },
            {
              name: 'faq',
              type: 'array',
              maxRows: 3,
              admin: {
                description: 'Frequently Asked Questions (up to 3)',
              },
              fields: [
                {
                  name: 'question',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'FAQ question',
                  },
                },
                {
                  name: 'answer',
                  type: 'textarea',
                  required: true,
                  admin: {
                    description: 'FAQ answer',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
