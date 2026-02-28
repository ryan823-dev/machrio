import type { CollectionConfig } from 'payload'

export const VerificationCodes: CollectionConfig = {
  slug: 'verification-codes',
  admin: {
    group: 'Account',
    defaultColumns: ['email', 'verified', 'attempts', 'expiresAt', 'createdAt'],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'code',
      type: 'text',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
