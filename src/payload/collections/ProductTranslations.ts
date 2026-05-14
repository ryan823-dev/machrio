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

export const ProductTranslations: CollectionConfig = {
  slug: 'product-translations',
  labels: {
    singular: '产品翻译',
    plural: '产品翻译',
  },
  admin: {
    useAsTitle: 'name',
    group: '多语言',
    defaultColumns: ['product', 'locale', 'name', 'status', 'updatedAt'],
    description: 'Localized product content. English product records remain the source of truth.',
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
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
      name: 'shortName',
      type: 'text',
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
    },
    {
      name: 'fullDescription',
      type: 'richText',
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
