import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: '分类',
    plural: '分类',
  },
  admin: {
    useAsTitle: 'name',
    group: '产品目录',
    defaultColumns: ['name', 'slug', 'parent', 'productCount'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Display name for the category',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly identifier (auto-generated)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
        description: 'Parent category (leave empty for top-level)',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'SEO description (minimum 150 words recommended)',
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Short description for cards (max 160 chars)',
      },
    },
    {
      name: 'introContent',
      type: 'textarea',
      admin: {
        description: 'SEO intro paragraph shown at top of category page (expandable, 150-200 words)',
      },
    },
    {
      name: 'buyingGuide',
      type: 'richText',
      admin: {
        description: 'How to choose guide - shown at bottom before FAQ (200-300 words)',
      },
    },
    {
      name: 'faq',
      type: 'array',
      maxRows: 10,
      admin: {
        description: 'Frequently Asked Questions (4-6 recommended for SEO)',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          admin: {
            description: 'The question (e.g., "What certifications should I look for?")',
          },
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          admin: {
            description: 'The answer (2-4 sentences, include relevant keywords)',
          },
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Category banner image',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Category icon for navigation',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show on homepage',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Order for sorting (lower = first)',
      },
    },
    {
      name: 'facetGroups',
      type: 'array',
      admin: {
        description: 'Configure which filter dimensions to show',
      },
      fields: [
        {
          name: 'facetName',
          type: 'select',
          required: true,
          options: [
            { label: 'Material', value: 'material' },
            { label: 'Size', value: 'size' },
            { label: 'Color', value: 'color' },
            { label: 'Brand', value: 'brand' },
            { label: 'Certification', value: 'certification' },
            { label: 'Price Range', value: 'priceRange' },
            { label: 'Availability', value: 'availability' },
          ],
        },
        {
          name: 'expanded',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Show expanded by default',
          },
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'SEO overrides (leave empty to use defaults)',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          maxLength: 60,
          admin: {
            description: 'Override default title (max 60 chars)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
          admin: {
            description: 'Override default description (max 160 chars)',
          },
        },
      ],
    },
    {
      name: 'seoContent',
      type: 'richText',
      admin: {
        description: 'Additional SEO content for bottom of page',
      },
    },
    {
      name: 'productCount',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Number of products (auto-calculated)',
      },
    },
  ],
}
