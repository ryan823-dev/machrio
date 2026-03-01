import type { GlobalConfig } from 'payload'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: '首页',
  admin: {
    group: '内容',
  },
  fields: [
    // Announcement Bar
    {
      name: 'announcement',
      type: 'group',
      admin: {
        description: 'Top announcement bar displayed across the site',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          admin: { description: 'Announcement message' },
        },
        {
          name: 'linkUrl',
          type: 'text',
          admin: { description: 'Click destination URL (optional)' },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // Hero Banners
    {
      name: 'heroBanners',
      type: 'array',
      admin: {
        description: 'Homepage hero carousel banners',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'subtitle',
          type: 'text',
        },
        {
          name: 'buttonText',
          type: 'text',
          admin: { description: 'CTA button text, e.g., Shop Now' },
        },
        {
          name: 'linkUrl',
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

    // Featured Categories
    {
      name: 'featuredCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Categories shown in Browse Categories section (overrides default displayOrder)',
      },
    },

    // Promotion Banner
    {
      name: 'promotionBanner',
      type: 'group',
      admin: {
        description: 'Mid-page promotional banner',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'linkUrl',
          type: 'text',
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },

    // SEO
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'Homepage SEO overrides',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          maxLength: 60,
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
        },
      ],
    },
  ],
}
