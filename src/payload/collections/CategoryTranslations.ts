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

export const CategoryTranslations: CollectionConfig = {
  slug: 'category-translations',
  labels: {
    singular: '分类翻译',
    plural: '分类翻译',
  },
  admin: {
    useAsTitle: 'name',
    group: '多语言',
    defaultColumns: ['category', 'locale', 'name', 'status', 'updatedAt'],
    description: 'Localized category content with English category records as fallback.',
  },
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
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
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      maxLength: 180,
    },
    {
      name: 'introContent',
      type: 'textarea',
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'buyingGuide',
      type: 'richText',
    },
    {
      name: 'faq',
      type: 'array',
      maxRows: 10,
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
