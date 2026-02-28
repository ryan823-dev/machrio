import type { CollectionConfig } from 'payload'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: {
    useAsTitle: 'displayTitle',
    group: 'Sales',
    defaultColumns: ['displayTitle', 'subject', 'status', 'submittedAt'],
  },
  fields: [
    {
      name: 'displayTitle',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.company && data?.name) {
              return `${data.company} - ${data.name}`
            }
            return data?.name || data?.email || 'New Contact'
          },
        ],
      },
    },
    {
      name: 'submittedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'subject',
      type: 'select',
      required: true,
      options: [
        { label: 'General Inquiry', value: 'general' },
        { label: 'Customer Support', value: 'support' },
        { label: 'Order Status', value: 'order' },
        { label: 'Returns & Refunds', value: 'return' },
        { label: 'Business Partnership', value: 'partnership' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Replied', value: 'replied' },
        { label: 'Resolved', value: 'resolved' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes' },
    },
  ],
}
