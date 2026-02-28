import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    description: 'Blog posts, buying guides, and knowledge articles for SEO and content marketing',
  },
  versions: {
    drafts: true,
  },
  fields: [
    // ── Basic Info ──
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Article title — include target keyword naturally' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL slug (auto-generated from title if left empty)' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: { description: 'Short summary shown on cards and in meta description (max 300 chars)' },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: { description: 'Full article content. Use headings (H2, H3) for structure.' },
    },

    // ── Classification ──
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Buying Guide', value: 'buying-guide' },
        { label: 'Industry Insight', value: 'industry-insight' },
        { label: 'How-To', value: 'how-to' },
        { label: 'Product Comparison', value: 'product-comparison' },
      ],
      admin: { description: 'Primary content category' },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: { description: 'Tags for filtering (e.g. "safety", "adhesives", "manufacturing")' },
    },

    // ── Author & Media ──
    {
      name: 'author',
      type: 'text',
      defaultValue: 'Machrio Team',
      admin: { description: 'Author name displayed on the article' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Featured image for article cards and hero section' },
    },

    // ── Publishing ──
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      index: true,
      admin: { description: 'Only published articles appear on the site' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: {
        description: 'Publication date (auto-set when status changes to published)',
        date: { pickerAppearance: 'dayOnly' },
      },
    },

    // ── Relationships ──
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { description: 'Products to display at the bottom of the article' },
    },
    {
      name: 'relatedCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Related product categories for internal linking' },
    },

    // ── SEO ──
    {
      name: 'seo',
      type: 'group',
      admin: { description: 'SEO overrides (leave empty to auto-generate from title/excerpt)' },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          maxLength: 60,
          admin: { description: 'Custom meta title (max 60 chars). Defaults to article title.' },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
          admin: { description: 'Custom meta description (max 160 chars). Defaults to excerpt.' },
        },
      ],
    },

    // ── Computed ──
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Estimated reading time in minutes (auto-calculated)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-set publishedAt when status changes to published
        if (data?.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
}
