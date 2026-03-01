import type { CollectionConfig } from 'payload'

export const FreeShippingRules: CollectionConfig = {
  slug: 'free-shipping-rules',
  labels: {
    singular: '包邮规则',
    plural: '包邮规则',
  },
  admin: {
    useAsTitle: 'name',
    group: '营销',
    defaultColumns: ['name', 'minimumAmount', 'countryCode', 'isActive'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "Economy Free Shipping $500+"' },
    },
    {
      name: 'shippingMethod',
      type: 'relationship',
      relationTo: 'shipping-methods',
      required: true,
      admin: { description: 'Which shipping method this threshold applies to' },
    },
    {
      name: 'countryCode',
      type: 'text',
      admin: { description: 'Leave blank for global, or set ISO code (e.g. "US") for country-specific rule' },
    },
    {
      name: 'minimumAmount',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'Minimum order subtotal (USD) to qualify for free shipping' },
    },
    {
      name: 'message',
      type: 'text',
      admin: { description: 'Custom prompt template, e.g. "Add ${gap} more for free shipping!"' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
