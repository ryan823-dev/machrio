import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: '用户',
    plural: '用户',
  },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: '管理',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Sales', value: 'sales' },
      ],
      defaultValue: 'editor',
      required: true,
    },
  ],
}
