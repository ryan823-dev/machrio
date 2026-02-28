import type { CollectionConfig } from 'payload'

export const ShippingRates: CollectionConfig = {
  slug: 'shipping-rates',
  admin: {
    useAsTitle: 'displayName',
    group: 'Logistics',
    defaultColumns: ['displayName', 'countryCode', 'baseWeight', 'baseRate', 'additionalRate', 'handlingFee', 'isActive'],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated from method + country',
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const code = siblingData.countryCode || ''
            return `${code} Rate`
          },
        ],
      },
    },
    {
      name: 'shippingMethod',
      type: 'relationship',
      relationTo: 'shipping-methods',
      required: true,
      admin: { description: 'Which shipping method this rate applies to' },
    },
    {
      name: 'countryCode',
      type: 'text',
      required: true,
      admin: { description: 'ISO country code e.g. "US", "DE", "GB". Use "OTHER" as fallback for unlisted countries.' },
    },
    {
      name: 'countryName',
      type: 'text',
      admin: { description: 'Display name e.g. "United States", "Germany"' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'baseWeight',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            width: '50%',
            description: 'Included base weight (kg)',
          },
        },
        {
          name: 'baseRate',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            width: '50%',
            description: 'Cost for base weight (USD)',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'additionalRate',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            width: '50%',
            description: 'Cost per kg above base weight (USD)',
          },
        },
        {
          name: 'handlingFee',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: {
            width: '50%',
            description: 'Flat handling/processing fee (USD)',
          },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { position: 'sidebar', description: 'Internal notes' },
    },
  ],
}
