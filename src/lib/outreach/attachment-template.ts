/**
 * 邮件附件模板服务
 *
 * 为每个租户(企业)提供可配置的邮件附件模板
 * 支持 PDF 目录、产品手册、宣传资料等
 */

import { Resend } from 'resend'
import { getFromEmail } from '@/lib/contact'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null
const FROM_EMAIL = getFromEmail()

// ==================== 类型定义 ====================

export interface AttachmentTemplate {
  id: string
  tenantId: string
  name: string
  filename: string
  contentType: string
  storageKey: string
  size: number
  category: 'catalog' | 'brochure' | 'presentation' | 'datasheet' | 'other'
  industry?: string
  description?: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EmailAttachment {
  filename: string
  content: string  // Base64 encoded
  contentType?: string
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  attachments?: EmailAttachment[]
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown email error'
}

// ==================== Resend 邮件发送 ====================

/**
 * 使用 Resend 发送带附件的邮件
 */
export async function sendEmailWithAttachments(options: SendEmailOptions): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  if (!resend) {
    return { success: false, error: 'Resend not configured' }
  }

  if (!options.attachments || options.attachments.length === 0) {
    // 无附件，使用普通发送
    try {
      const result = await resend.emails.send({
        from: options.from || FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
      return { success: true, messageId: result.data?.id }
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) }
    }
  }

  // 带附件发送
  try {
    const result = await resend.emails.send({
      from: options.from || FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    })
    return { success: true, messageId: result.data?.id }
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) }
  }
}

// ==================== 附件模板管理 ====================

// 内存缓存，实际项目中应使用数据库
const templateCache = new Map<string, AttachmentTemplate[]>()

/**
 * 创建附件模板记录
 */
export async function createAttachmentTemplate(data: {
  tenantId: string
  name: string
  filename: string
  contentType: string
  storageKey: string
  size: number
  category: AttachmentTemplate['category']
  industry?: string
  description?: string
  isDefault?: boolean
}): Promise<AttachmentTemplate> {
  const template: AttachmentTemplate = {
    id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId: data.tenantId,
    name: data.name,
    filename: data.filename,
    contentType: data.contentType,
    storageKey: data.storageKey,
    size: data.size,
    category: data.category,
    industry: data.industry,
    description: data.description,
    isDefault: data.isDefault || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // 更新缓存
  const tenantTemplates = templateCache.get(data.tenantId) || []
  if (template.isDefault) {
    // 取消该租户其他默认模板
    tenantTemplates.forEach(t => {
      if (t.isDefault) t.isDefault = false
    })
  }
  tenantTemplates.push(template)
  templateCache.set(data.tenantId, tenantTemplates)

  return template
}

/**
 * 获取租户的所有附件模板
 */
export async function getAttachmentTemplates(tenantId: string): Promise<AttachmentTemplate[]> {
  return templateCache.get(tenantId) || []
}

/**
 * 根据分类获取租户的附件模板
 */
export async function getTemplatesByCategory(
  tenantId: string,
  category: AttachmentTemplate['category']
): Promise<AttachmentTemplate[]> {
  const templates = templateCache.get(tenantId) || []
  return templates.filter(t => t.category === category)
}

/**
 * 获取租户的默认附件模板
 */
export async function getDefaultTemplate(tenantId: string): Promise<AttachmentTemplate | null> {
  const templates = templateCache.get(tenantId) || []
  return templates.find(t => t.isDefault) || null
}

/**
 * 更新附件模板
 */
export async function updateAttachmentTemplate(
  id: string,
  tenantId: string,
  updates: Partial<Omit<AttachmentTemplate, 'id' | 'tenantId' | 'createdAt'>>
): Promise<AttachmentTemplate | null> {
  const templates = templateCache.get(tenantId) || []
  const index = templates.findIndex(t => t.id === id)

  if (index === -1) return null

  const template = templates[index]

  if (updates.isDefault && !template.isDefault) {
    // 取消其他默认模板
    templates.forEach(t => {
      if (t.isDefault) t.isDefault = false
    })
  }

  templates[index] = {
    ...template,
    ...updates,
    updatedAt: new Date(),
  }

  templateCache.set(tenantId, templates)
  return templates[index]
}

/**
 * 删除附件模板
 */
export async function deleteAttachmentTemplate(id: string, tenantId: string): Promise<boolean> {
  const templates = templateCache.get(tenantId) || []
  const index = templates.findIndex(t => t.id === id)

  if (index === -1) return false

  templates.splice(index, 1)
  templateCache.set(tenantId, templates)
  return true
}

/**
 * 从 OSS 下载附件并转为 Base64
 */
export async function getAttachmentAsBase64(_storageKey: string): Promise<string | null> {
  // 实际实现：从 OSS 下载文件并转为 Base64
  // 这里需要集成 OSS 客户端
  void _storageKey
  try {
    // const ossClient = getOSSClient()
    // const result = await ossClient.get(storageKey)
    // const buffer = await getBuffer(result.content)
    // return buffer.toString('base64')
    return null
  } catch (err) {
    console.error('[AttachmentTemplate] Failed to get attachment from OSS:', err)
    return null
  }
}

/**
 * 构建邮件附件列表
 * 根据模板ID列表获取附件内容
 */
export async function buildEmailAttachments(
  tenantId: string,
  templateIds: string[]
): Promise<EmailAttachment[]> {
  const templates = templateCache.get(tenantId) || []
  const attachments: EmailAttachment[] = []

  for (const id of templateIds) {
    const template = templates.find(t => t.id === id)
    if (!template) continue

    // 从 OSS 获取附件内容
    const base64Content = await getAttachmentAsBase64(template.storageKey)
    if (base64Content) {
      attachments.push({
        filename: template.filename,
        content: base64Content,
        contentType: template.contentType,
      })
    }
  }

  return attachments
}

/**
 * 发送带附件模板的邮件
 */
export async function sendEmailWithTemplateAttachments(
  tenantId: string,
  options: Omit<SendEmailOptions, 'attachments'>,
  templateIds?: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let attachments: EmailAttachment[] = []

  if (templateIds && templateIds.length > 0) {
    attachments = await buildEmailAttachments(tenantId, templateIds)
  } else {
    // 使用默认模板
    const defaultTemplate = await getDefaultTemplate(tenantId)
    if (defaultTemplate) {
      const base64 = await getAttachmentAsBase64(defaultTemplate.storageKey)
      if (base64) {
        attachments = [{
          filename: defaultTemplate.filename,
          content: base64,
          contentType: defaultTemplate.contentType,
        }]
      }
    }
  }

  return sendEmailWithAttachments({
    ...options,
    attachments,
  })
}
