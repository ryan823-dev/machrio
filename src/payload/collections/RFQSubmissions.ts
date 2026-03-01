import type { CollectionConfig } from 'payload'

export const RFQSubmissions: CollectionConfig = {
  slug: 'rfq-submissions',
  admin: {
    useAsTitle: 'displayTitle',
    group: 'Sales',
    defaultColumns: ['displayTitle', 'status', 'submittedAt'],
  },
  fields: [
    // Display title for admin list (computed from customer info)
    {
      name: 'displayTitle',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.customer?.company && data?.customer?.name) {
              return `${data.customer.company} - ${data.customer.name}`
            }
            return data?.customer?.company || data?.customer?.name || 'New RFQ'
          },
        ],
      },
    },

    // Submission timestamp
    {
      name: 'submittedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
        },
      },
    },

    // Customer Information
    {
      name: 'customer',
      type: 'group',
      fields: [
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
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'Job title',
          },
        },
      ],
    },

    // Inquiry Details
    {
      name: 'inquiry',
      type: 'group',
      fields: [
        {
          name: 'products',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          admin: {
            description: 'Products the customer is inquiring about',
          },
        },
        {
          name: 'quantity',
          type: 'number',
          admin: {
            description: 'Requested quantity',
          },
        },
        {
          name: 'message',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Customer message/requirements',
          },
        },
        {
          name: 'attachments',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          admin: {
            description: 'Specification documents, drawings, etc.',
          },
        },
      ],
    },

    // Customer Reference (link to Customers collection)
    {
      name: 'customerRef',
      type: 'relationship',
      relationTo: 'customers',
      admin: {
        position: 'sidebar',
        description: 'Link to customer profile',
      },
    },

    // Quote generated from this RFQ
    {
      name: 'quote',
      type: 'relationship',
      relationTo: 'quotes',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Quote created from this inquiry',
      },
    },

    // Status Tracking
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Converted', value: 'converted' },
        { label: 'Lost', value: 'lost' },
      ],
      admin: {
        position: 'sidebar',
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

    // Source Tracking
    {
      name: 'source',
      type: 'group',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'page',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Page where form was submitted',
          },
        },
        {
          name: 'referrer',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Referrer URL',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ operation, doc }) => {
        // Send email notification on new submission
        if (operation === 'create') {
          // Email logic will be implemented in lib/rfq/email.ts
          console.log('New RFQ submission:', doc.customer?.email)
        }
      },
    ],
  },
}
