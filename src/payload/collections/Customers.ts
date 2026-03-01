import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: {
    singular: '客户',
    plural: '客户',
  },
  admin: {
    useAsTitle: 'company',
    group: '销售',
    defaultColumns: ['company', 'name', 'email', 'source', 'tags', 'createdAt'],
  },
  fields: [
    {
      name: 'company',
      type: 'text',
      required: true,
      admin: {
        description: 'Company name',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Primary contact name',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Primary email (unique identifier)',
      },
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Job title',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Direct Order', value: 'direct' },
        { label: 'RFQ Inquiry', value: 'rfq' },
        { label: 'Contact Form', value: 'contact' },
        { label: 'Manual Entry', value: 'manual' },
      ],
      admin: {
        position: 'sidebar',
        description: 'How this customer was first acquired',
      },
    },

    // Shipping Addresses
    {
      name: 'shippingAddresses',
      type: 'array',
      admin: {
        description: 'Saved shipping addresses',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          admin: {
            description: 'e.g., Headquarters, Warehouse',
            width: '50%',
          },
        },
        {
          name: 'address',
          type: 'textarea',
          required: true,
        },
        {
          name: 'city',
          type: 'text',
          required: true,
          admin: { width: '33%' },
        },
        {
          name: 'state',
          type: 'text',
          required: true,
          admin: { width: '33%' },
        },
        {
          name: 'postalCode',
          type: 'text',
          required: true,
          admin: { width: '33%' },
        },
        {
          name: 'country',
          type: 'text',
          required: true,
          defaultValue: 'US',
          admin: {
            description: 'Country code, e.g. US, CA, HK',
          },
        },
      ],
    },

    // Billing Info
    {
      name: 'billingInfo',
      type: 'group',
      admin: {
        description: 'Invoice / billing information',
      },
      fields: [
        {
          name: 'companyLegalName',
          type: 'text',
          admin: { description: 'Legal entity name for invoicing' },
        },
        {
          name: 'taxId',
          type: 'text',
          admin: { description: 'Tax ID / VAT number' },
        },
        {
          name: 'billingAddress',
          type: 'textarea',
        },
      ],
    },

    // Tags
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'e.g., VIP, Key Account, Follow Up',
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
