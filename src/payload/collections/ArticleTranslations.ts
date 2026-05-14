import type { CollectionConfig } from 'payload'

const localeOptions = [
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Thai', value: 'th' },
  { label: 'Indonesian', value: 'id' },
]

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
]

export const ArticleTranslations: CollectionConfig = {
  slug: 'article-translations',
  labels: {
    singular: '文章翻译',
    plural: '文章翻译',
  },
  admin: {
    useAsTitle: 'title',
    group: '多语言',
    defaultColumns: ['article', 'locale', 'title', 'status', 'updatedAt'],
    description: 'Localized knowledge center articles. Slugs stay aligned with the English article for launch stability.',
  },
  fields: [
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
      index: true,
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      index: true,
      options: localeOptions,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: statusOptions,
      admin: { position: 'sidebar' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 320,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'quickAnswer',
      type: 'textarea',
      maxLength: 320,
    },
    {
      name: 'faq',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text', maxLength: 70 },
        { name: 'metaDescription', type: 'textarea', maxLength: 180 },
      ],
    },
  ],
}
