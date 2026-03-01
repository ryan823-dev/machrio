import type { CollectionConfig } from 'payload'

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: {
    singular: '重定向',
    plural: '重定向',
  },
  admin: {
    useAsTitle: 'from',
    group: '设置',
    defaultColumns: ['from', 'to', 'type', 'isActive'],
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      admin: { description: 'Source path, e.g., /old-page' },
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: { description: 'Destination path, e.g., /new-page' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: '301',
      options: [
        { label: '301 Permanent', value: '301' },
        { label: '302 Temporary', value: '302' },
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
      type: 'text',
      admin: { description: 'Reason for redirect' },
    },
  ],
}
