import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'sku', 'primaryCategory', 'brand', 'status'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    // Basic Information
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
              // Add SKU snippet for uniqueness
              const skuPart = data.sku
                ? `-${data.sku.toLowerCase().slice(-4)}`
                : ''
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

    // Categories & Brand
    {
      name: 'primaryCategory',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: {
        description: 'Main category (used in URL)',
      },
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
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      required: true,
    },

    // Descriptions
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Brief description (50+ words, used for meta description)',
      },
    },
    {
      name: 'fullDescription',
      type: 'richText',
      required: true,
      admin: {
        description: 'Full product description (300+ words for SEO)',
      },
    },

    // Specifications
    {
      name: 'specifications',
      type: 'array',
      admin: {
        description: 'Technical specifications',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'unit',
          type: 'text',
          admin: {
            width: '33%',
            description: 'e.g., kg, mm, pcs',
          },
        },
      ],
    },

    // Images
    {
      name: 'externalImageUrl',
      type: 'text',
      admin: {
        description: 'External image URL (e.g., from supplier CDN)',
      },
    },
    {
      name: 'primaryImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Main product image (overrides external URL)',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Additional product images',
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

    // Purchase Mode: controls whether product can be bought online, RFQ only, or both
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
        description: 'How customers can purchase this product',
      },
    },

    // Pricing
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'basePrice',
          type: 'number',
          admin: {
            description: 'Standard unit price (leave empty for RFQ-only)',
          },
        },
        {
          name: 'priceUnit',
          type: 'text',
          admin: {
            description: 'e.g., per piece, per box, per 100',
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
        },
        {
          name: 'tieredPricing',
          type: 'array',
          admin: {
            description: 'Volume discount tiers',
          },
          fields: [
            {
              name: 'minQty',
              type: 'number',
              required: true,
              admin: { description: 'Minimum quantity', width: '33%' },
            },
            {
              name: 'maxQty',
              type: 'number',
              admin: { description: 'Maximum quantity (leave empty for no limit)', width: '33%' },
            },
            {
              name: 'unitPrice',
              type: 'number',
              required: true,
              admin: { description: 'Price per unit at this tier', width: '33%' },
            },
          ],
        },
        {
          name: 'compareAtPrice',
          type: 'number',
          admin: {
            description: 'Original price before discount (strikethrough display)',
          },
        },
      ],
    },

    // Availability
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
    },
    {
      name: 'minOrderQuantity',
      type: 'number',
      admin: {
        description: 'Minimum order quantity',
      },
    },
    {
      name: 'packageQty',
      type: 'number',
      admin: {
        description: 'Number of units per package (e.g., 12 gloves per box)',
      },
    },
    {
      name: 'packageUnit',
      type: 'text',
      admin: {
        description: 'Package unit label (e.g., box, case, pack, roll)',
      },
    },
    {
      name: 'leadTime',
      type: 'text',
      admin: {
        description: 'e.g., 2-3 weeks, Ships in 1 day',
      },
    },

    // Shipping
    {
      name: 'shippingInfo',
      type: 'group',
      admin: { description: 'Shipping weight and processing time' },
      fields: [
        {
          name: 'weight',
          type: 'number',
          min: 0,
          admin: { description: 'Actual product weight in kg (used for shipping calculation)' },
        },
        {
          name: 'processingTime',
          type: 'number',
          min: 0,
          defaultValue: 3,
          admin: { description: 'Days needed to prepare for shipment (default: 3)' },
        },
      ],
    },

    // Facets for filtering
    {
      name: 'facets',
      type: 'group',
      admin: {
        description: 'Filterable attributes',
      },
      fields: [
        {
          name: 'material',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'e.g., Nitrile, Leather, Cotton',
          },
        },
        {
          name: 'size',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'e.g., S, M, L, XL',
          },
        },
        {
          name: 'color',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'e.g., Blue, Black, White',
          },
        },
        {
          name: 'certification',
          type: 'text',
          hasMany: true,
          admin: {
            description: 'e.g., ANSI, CE, ISO 9001',
          },
        },
      ],
    },

    // Related Products
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Related products for cross-selling',
      },
    },

    // Industries
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

    // SEO
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
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
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
  ],
}
