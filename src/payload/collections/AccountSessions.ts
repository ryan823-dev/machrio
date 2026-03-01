import type { CollectionConfig } from 'payload'

export const AccountSessions: CollectionConfig = {
  slug: 'account-sessions',
  labels: {
    singular: '登录会话',
    plural: '登录会话',
  },
  admin: {
    group: '账户',
    defaultColumns: ['email', 'expiresAt', 'createdAt'],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
  ],
}
