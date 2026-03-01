import type { CollectionConfig } from 'payload'

export const Quotes: CollectionConfig = {
  slug: 'quotes',
  labels: {
    singular: '报价单',
    plural: '报价单',
  },
  admin: {
    useAsTitle: 'quoteNumber',
    group: '销售',
    defaultColumns: ['quoteNumber', 'customer', 'status', 'total', 'validUntil', 'createdAt'],
  },
  fields: [
    // Quote Number - auto-generated
    {
      name: 'quoteNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (!value) {
              const now = new Date()
              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
              const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
              return `Q-${dateStr}-${rand}`
            }
            return value
          },
        ],
      },
    },

    // Status
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Converted to Order', value: 'converted' },
        { label: 'Expired', value: 'expired' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },

    // Source RFQ (optional - supports proactive quoting)
    {
      name: 'rfq',
      type: 'relationship',
      relationTo: 'rfq-submissions',
      admin: {
        description: 'Source RFQ inquiry (leave empty for proactive quotes)',
      },
    },

    // Customer
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
    },

    // Line Items
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'productName',
          type: 'text',
          required: true,
          admin: { description: 'Snapshot of product name' },
        },
        {
          name: 'sku',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'unitPrice',
          type: 'number',
          required: true,
          admin: { description: 'Quoted unit price' },
        },
        {
          name: 'lineTotal',
          type: 'number',
          required: true,
          admin: { description: 'quantity × unitPrice' },
        },
        {
          name: 'notes',
          type: 'text',
          admin: { description: 'Lead time, special conditions, etc.' },
        },
      ],
    },

    // Totals
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'shippingCost',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'tax',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'USD',
      options: [
        { label: 'USD', value: 'USD' },
        { label: 'CAD', value: 'CAD' },
      ],
      admin: { position: 'sidebar' },
    },

    // Validity
    {
      name: 'validUntil',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Quote expiry date',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // Terms
    {
      name: 'terms',
      type: 'textarea',
      admin: {
        description: 'Payment terms, delivery conditions, etc.',
      },
    },

    // Converted Order (back-reference)
    {
      name: 'convertedOrder',
      type: 'relationship',
      relationTo: 'orders',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Order created from this quote',
      },
    },

    // Assignment
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Sales representative',
      },
    },

    // Internal Notes
    {
      name: 'notes',
      type: 'richText',
      admin: {
        description: 'Internal notes (not visible to customer)',
      },
    },
  ],
}
