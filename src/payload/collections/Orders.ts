import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: '订单',
    plural: '订单',
  },
  admin: {
    useAsTitle: 'orderNumber',
    group: '销售',
    defaultColumns: ['orderNumber', 'customer.company', 'status', 'paymentStatus', 'total', 'createdAt'],
  },
  fields: [
    {
      name: 'orderNumber',
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
              const ts = Date.now().toString(36).toUpperCase()
              const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
              return `MRO-${ts}-${rand}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      options: [
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: { position: 'sidebar' },
    },

    // Order Source
    {
      name: 'source',
      type: 'select',
      defaultValue: 'direct',
      options: [
        { label: 'Direct Order', value: 'direct' },
        { label: 'From RFQ/Quote', value: 'rfq' },
      ],
      admin: {
        position: 'sidebar',
        description: 'How this order was created',
      },
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

    // Customer Info (snapshot at time of order)
    {
      name: 'customer',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        { name: 'company', type: 'text', required: true },
      ],
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
          admin: { description: 'Snapshot of product name at time of order' },
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
          admin: { description: 'Price per unit at time of order' },
        },
        {
          name: 'lineTotal',
          type: 'number',
          required: true,
        },
      ],
    },

    // Shipping
    {
      name: 'shipping',
      type: 'group',
      fields: [
        { name: 'address', type: 'textarea', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'postalCode', type: 'text', required: true },
        {
          name: 'country',
          type: 'text',
          required: true,
          defaultValue: 'US',
          admin: { description: 'Country code, e.g. US, CA, HK, GB' },
        },
        { name: 'method', type: 'text' },
        { name: 'trackingNumber', type: 'text' },
        {
          name: 'shippingMethodCode',
          type: 'text',
          admin: { description: 'Selected shipping method code, e.g. "standard", "economy"' },
        },
        {
          name: 'shippingMethodName',
          type: 'text',
          admin: { description: 'Snapshot of shipping method display name' },
        },
        {
          name: 'estimatedShipDate',
          type: 'text',
          admin: { description: 'Calculated ship date (ISO string)' },
        },
        {
          name: 'estimatedDeliveryDate',
          type: 'text',
          admin: { description: 'Calculated delivery date (ISO string)' },
        },
        {
          name: 'totalWeight',
          type: 'number',
          admin: { description: 'Total chargeable weight in kg' },
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
        { label: 'HKD', value: 'HKD' },
        { label: 'EUR', value: 'EUR' },
        { label: 'GBP', value: 'GBP' },
        { label: 'CAD', value: 'CAD' },
        { label: 'CNY', value: 'CNY' },
      ],
      admin: { position: 'sidebar' },
    },

    // Payment
    {
      name: 'payment',
      type: 'group',
      fields: [
        {
          name: 'method',
          type: 'select',
          options: [
            { label: 'Stripe (Online)', value: 'stripe' },
            { label: 'PayPal', value: 'paypal' },
            { label: 'Bank Transfer', value: 'bank-transfer' },
          ],
        },
        {
          name: 'stripeSessionId',
          type: 'text',
          admin: { description: 'Stripe Checkout Session ID', readOnly: true },
        },
        {
          name: 'stripePaymentIntentId',
          type: 'text',
          admin: { description: 'Stripe Payment Intent ID', readOnly: true },
        },
        {
          name: 'paypalOrderId',
          type: 'text',
          admin: { description: 'PayPal Order ID', readOnly: true },
        },
        {
          name: 'paypalCaptureId',
          type: 'text',
          admin: { description: 'PayPal Capture ID', readOnly: true },
        },
        { name: 'transactionId', type: 'text' },
        // Bank Transfer specific fields
        {
          name: 'receiptUploaded',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Payment receipt has been uploaded', position: 'sidebar' },
        },
        {
          name: 'receiptUploadDate',
          type: 'date',
          admin: {
            description: 'When the receipt was uploaded',
            position: 'sidebar',
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
      ],
    },

    // Payment Receipt Upload (for Bank Transfer)
    {
      name: 'paymentReceipt',
      type: 'upload',
      relationTo: 'payment-receipts',
      admin: {
        description: 'Bank transfer payment receipt/proof',
        position: 'sidebar',
      },
    },

    // Customer notes
    {
      name: 'customerNotes',
      type: 'textarea',
      admin: { description: 'Notes from the customer at checkout' },
    },

    // Internal
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'richText',
      admin: { description: 'Internal notes' },
    },
  ],
}
