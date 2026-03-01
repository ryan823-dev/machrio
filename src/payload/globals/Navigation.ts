import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: '导航菜单',
  admin: {
    group: '设置',
  },
  fields: [
    // Main Navigation
    {
      name: 'mainNav',
      type: 'array',
      admin: {
        description: 'Top navigation bar links',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },

    // Footer Navigation
    {
      name: 'footerNav',
      type: 'array',
      admin: {
        description: 'Footer navigation groups',
      },
      fields: [
        {
          name: 'groupTitle',
          type: 'text',
          required: true,
          admin: { description: 'Column heading, e.g., Customer Service, Company' },
        },
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
            {
              name: 'isActive',
              type: 'checkbox',
              defaultValue: true,
            },
          ],
        },
      ],
    },
  ],
}
