import type { CollectionConfig } from 'payload'

export const GlossaryTerms: CollectionConfig = {
  slug: 'glossary-terms',
  labels: {
    singular: '术语',
    plural: '术语词典',
  },
  admin: {
    useAsTitle: 'term',
    group: '内容',
    defaultColumns: ['term', 'category', 'status'],
    description: 'Industrial glossary terms for SEO — "What is PPE", "What is LOTO", etc.',
  },
  fields: [
    {
      name: 'term',
      type: 'text',
      required: true,
      admin: { description: 'The term or acronym (e.g. "PPE", "LOTO", "MRO")' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL slug (auto-generated from term)' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.term) {
              return (data.term as string)
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
      name: 'fullName',
      type: 'text',
      admin: { description: 'Full expanded name if the term is an acronym (e.g. "Personal Protective Equipment")' },
    },
    {
      name: 'definition',
      type: 'textarea',
      required: true,
      admin: { description: 'Concise 1-2 sentence definition shown at the top of the page' },
    },
    {
      name: 'content',
      type: 'richText',
      admin: { description: 'Detailed explanation, examples, standards, and best practices' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Safety & Compliance', value: 'safety' },
        { label: 'Maintenance & Operations', value: 'maintenance' },
        { label: 'Materials & Components', value: 'materials' },
        { label: 'Procurement & Supply Chain', value: 'procurement' },
        { label: 'Tools & Equipment', value: 'tools' },
        { label: 'Standards & Certifications', value: 'standards' },
      ],
      admin: { description: 'Topic category for grouping and filtering' },
    },
    {
      name: 'relatedTerms',
      type: 'relationship',
      relationTo: 'glossary-terms',
      hasMany: true,
      admin: { description: 'Related glossary terms for internal linking' },
    },
    {
      name: 'relatedCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Related product categories' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      index: true,
    },
    {
      name: 'seo',
      type: 'group',
      admin: { description: 'SEO overrides' },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          maxLength: 60,
          admin: { description: 'Custom meta title. Defaults to "What is [Term]? | Machrio"' },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
          admin: { description: 'Custom meta description. Defaults to definition.' },
        },
      ],
    },
  ],
}
