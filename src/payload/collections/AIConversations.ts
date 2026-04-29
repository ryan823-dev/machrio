import type { CollectionConfig } from 'payload'

import { buildConversationDisplayTitle } from '@/lib/ai-conversation-insights'

const canManageAIConversations = (({ req }: { req: { user?: { role?: string } } }) => {
  const role = req.user?.role
  return role === 'admin' || role === 'sales'
}) as NonNullable<CollectionConfig['access']>['read']

export const AIConversations: CollectionConfig = {
  slug: 'ai-conversations',
  labels: {
    singular: 'AI 对话记录',
    plural: 'AI 对话记录',
  },
  admin: {
    useAsTitle: 'displayTitle',
    group: 'AI 助手',
    defaultColumns: ['displayTitle', 'conversationType', 'status', 'messageCount', 'lastMessageAt'],
    description: '查看 AI 助手对话原文，以及从对话里沉淀出的采购需求和关键信息。',
  },
  access: {
    read: canManageAIConversations,
    create: canManageAIConversations,
    update: canManageAIConversations,
    delete: canManageAIConversations,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data

        data.displayTitle = buildConversationDisplayTitle({
          sessionId: String(data.sessionId || ''),
          user: data.user,
          latestUserNeed: data.latestUserNeed,
          sourcePage: data.latestSourcePage || data.firstSourcePage,
        })

        return data
      },
    ],
  },
  fields: [
    {
      name: 'displayTitle',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Follow Up', value: 'follow_up' },
        { label: 'Resolved', value: 'resolved' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'conversationType',
      type: 'select',
      options: [
        { label: 'Product Inquiry', value: 'product_inquiry' },
        { label: 'RFQ Inquiry', value: 'rfq_inquiry' },
        { label: 'Shipping Inquiry', value: 'shipping_inquiry' },
        { label: 'Returns Support', value: 'returns_support' },
        { label: 'Technical Support', value: 'technical_support' },
        { label: 'General', value: 'general' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: '可选：指派跟进销售',
      },
    },
    {
      name: 'startedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
        },
      },
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm',
        },
      },
    },
    {
      name: 'messageCount',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'purchaseMode',
      type: 'select',
      options: [
        { label: 'Unknown', value: 'unknown' },
        { label: 'Buy Online', value: 'buy-online' },
        { label: 'RFQ', value: 'rfq' },
        { label: 'Both', value: 'both' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'firstSourcePage',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'firstSourceUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'latestSourcePage',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'latestSourceUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'user',
      type: 'group',
      fields: [
        {
          name: 'userId',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'userName',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'userEmail',
          type: 'email',
          admin: { readOnly: true },
        },
        {
          name: 'userPhone',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'userCompany',
          type: 'text',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'latestUserNeed',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: '最近一次用户明确表达的核心需求',
      },
    },
    {
      name: 'quantitySignal',
      type: 'text',
      admin: {
        readOnly: true,
        description: '从对话中抓取到的数量信息',
      },
    },
    {
      name: 'deliverySignal',
      type: 'text',
      admin: {
        readOnly: true,
        description: '从对话中抓取到的交期/发货要求',
      },
    },
    {
      name: 'contactEmail',
      type: 'email',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'contactPhone',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'salesSummary',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: '给销售或运营快速看的摘要',
      },
    },
    {
      name: 'mentionedSkus',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'recommendedProducts',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'productId',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'name',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'sku',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'price',
          type: 'text',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'messages',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'User', value: 'user' },
            { label: 'Assistant', value: 'assistant' },
            { label: 'System', value: 'system' },
          ],
          admin: { readOnly: true },
        },
        {
          name: 'timestamp',
          type: 'date',
          admin: {
            readOnly: true,
            date: {
              displayFormat: 'yyyy-MM-dd HH:mm:ss',
            },
          },
        },
        {
          name: 'content',
          type: 'textarea',
          admin: { readOnly: true },
        },
        {
          name: 'products',
          type: 'array',
          admin: {
            readOnly: true,
          },
          fields: [
            {
              name: 'id',
              type: 'text',
              admin: { readOnly: true },
            },
            {
              name: 'name',
              type: 'text',
              admin: { readOnly: true },
            },
            {
              name: 'sku',
              type: 'text',
              admin: { readOnly: true },
            },
            {
              name: 'price',
              type: 'text',
              admin: { readOnly: true },
            },
          ],
        },
      ],
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'referrer',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastCapturedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: '后台人工补充备注',
      },
    },
  ],
}
