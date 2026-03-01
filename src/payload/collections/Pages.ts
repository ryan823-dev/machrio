import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: '页面',
    plural: '页面',
  },
  admin: {
    useAsTitle: 'title',
    group: '内容',
    defaultColumns: ['title', 'slug', 'pageType', 'status', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL path, e.g., about, faq, privacy',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'pageType',
      type: 'select',
      required: true,
      options: [
        { label: 'Standard (Rich Text)', value: 'standard' },
        { label: 'FAQ Page', value: 'faq' },
        { label: 'About Us', value: 'about' },
        { label: 'Contact Page', value: 'contact' },
        { label: 'Support Page', value: 'support' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Determines the rendering template',
      },
    },

    // Hero Image
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional hero/banner image at the top of the page',
      },
    },

    // Main Content
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Main page content (Lexical rich text editor)',
      },
    },

    // FAQ Items (conditional: only for FAQ pages)
    {
      name: 'faqItems',
      type: 'array',
      admin: {
        description: 'FAQ question-answer pairs (generates FAQPage JSON-LD)',
        condition: (data) => data?.pageType === 'faq',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
        },
      ],
    },

    // Contact Info (conditional: only for Contact pages)
    {
      name: 'contactInfo',
      type: 'group',
      admin: {
        description: 'Contact information displayed on the page',
        condition: (data) => data?.pageType === 'contact',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'address',
          type: 'textarea',
        },
        {
          name: 'businessHours',
          type: 'text',
        },
      ],
    },

    // SEO
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'SEO overrides for this page',
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
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'noIndex',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Prevent this page from being indexed by search engines',
          },
        },
      ],
    },
  ],
}
