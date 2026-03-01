import type { CollectionConfig } from 'payload'

export const ShippingMethods: CollectionConfig = {
  slug: 'shipping-methods',
  labels: {
    singular: '配送方式',
    plural: '配送方式',
  },
  admin: {
    useAsTitle: 'name',
    group: '物流',
    defaultColumns: ['name', 'code', 'transitDays', 'isActive', 'sortOrder'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Display name, e.g. "Standard Air Shipping"' },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Internal code, e.g. "standard", "economy"' },
    },
    {
      name: 'transitDays',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'Transit time in calendar days (not displayed to buyer, used for ETA calculation)' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Customer-facing description of shipping service' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first' },
    },
  ],
}
