import type { CollectionConfig } from 'payload'

/**
 * 邮件附件模板 Collection
 *
 * 为每个租户(企业)提供可配置的邮件附件模板
 * 支持 PDF 目录、产品手册、宣传资料等
 */
export const AttachmentTemplates: CollectionConfig = {
  slug: 'attachment-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'isDefault', 'size', 'createdAt'],
    group: '获客外联',
    description: '管理邮件附件模板，支持 PDF 目录、产品手册、宣传资料等',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // 从用户信息中提取租户ID
        // 实际实现：根据认证机制从 req.user 获取 tenantId
        const user = req?.user as { tenantId?: string } | undefined
        if (user?.tenantId && !data.tenantId) {
          data.tenantId = user.tenantId
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'tenantId',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: '模板名称',
      admin: {
        description: '内部使用的模板名称，如 "2024产品目录"',
      },
    },
    {
      name: 'filename',
      type: 'text',
      required: true,
      label: '附件文件名',
      admin: {
        description: '邮件中显示的附件文件名，如 "Product-Catalog-2024.pdf"',
      },
    },
    {
      name: 'contentType',
      type: 'select',
      required: true,
      label: '文件类型',
      defaultValue: 'application/pdf',
      options: [
        { label: 'PDF 文档', value: 'application/pdf' },
        { label: 'Word 文档', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { label: 'Excel 表格', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { label: 'PowerPoint', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
        { label: '图片', value: 'image/jpeg' },
        { label: 'ZIP 压缩包', value: 'application/zip' },
        { label: '其他', value: 'application/octet-stream' },
      ],
    },
    {
      name: 'storageKey',
      type: 'text',
      required: true,
      label: 'OSS 存储路径',
      admin: {
        description: '文件在 OSS 中的存储路径',
        readOnly: true,
      },
    },
    {
      name: 'size',
      type: 'number',
      required: true,
      label: '文件大小 (字节)',
      admin: {
        description: '文件大小，单位：字节',
        readOnly: true,
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: '分类',
      defaultValue: 'catalog',
      options: [
        { label: '产品目录 (Catalog)', value: 'catalog' },
        { label: '宣传手册 (Brochure)', value: 'brochure' },
        { label: '演示文稿 (Presentation)', value: 'presentation' },
        { label: '技术规格书 (Datasheet)', value: 'datasheet' },
        { label: '其他', value: 'other' },
      ],
    },
    {
      name: 'industry',
      type: 'text',
      label: '适用行业',
      admin: {
        description: '可选，指定该模板适用的行业',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: '描述',
      admin: {
        description: '可选，模板的详细描述或用途说明',
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: '设为默认',
      defaultValue: false,
      admin: {
        description: '勾选后，该分类的默认附件模板将被替换',
      },
    },
    {
      name: 'downloadUrl',
      type: 'text',
      label: '下载链接',
      admin: {
        description: '可直接访问的 CDN 下载链接',
        readOnly: true,
      },
    },
    {
      name: 'usageCount',
      type: 'number',
      label: '使用次数',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
  indexes: [
    {
      fields: ['tenantId', 'category'],
    },
    {
      fields: ['tenantId', 'isDefault'],
    },
    {
      fields: ['tenantId', 'industry'],
    },
  ],
}
