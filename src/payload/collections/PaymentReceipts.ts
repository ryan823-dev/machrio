import type { CollectionConfig } from 'payload'

export const PaymentReceipts: CollectionConfig = {
  slug: 'payment-receipts',
  labels: {
    singular: 'Payment Receipt',
    plural: 'Payment Receipts',
  },
  admin: {
    useAsTitle: 'filename',
    group: '销售',
    defaultColumns: ['filename', 'orderNumber', 'uploadedBy', 'fileSize', 'createdAt'],
  },
  upload: {
    staticDir: 'payment-receipts',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'medium',
        width: 800,
        height: 600,
        position: 'centre',
      },
    ],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ],
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Associated order number',
      },
    },
    {
      name: 'orderId',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Link to order',
      },
    },
    {
      name: 'uploadedBy',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Customer email who uploaded this receipt',
      },
    },
    {
      name: 'fileSize',
      type: 'number',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'File size in bytes',
      },
    },
    {
      name: 'fileType',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'MIME type of the file',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes about this payment',
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Payment receipt verified by finance team',
      },
    },
    {
      name: 'verifiedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'User who verified this receipt',
      },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        // Auto-set filename and file info on upload
        if (operation === 'create' && data.file) {
          data.filename = data.file.filename
          data.fileSize = data.file.size
          data.fileType = data.file.mimeType
          
          // Set uploadedBy from request user or customer email
          if (req.user) {
            data.uploadedBy = req.user.email
          }
        }
        return data
      },
    ],
  },
}
