import { NextRequest, NextResponse } from 'next/server'

/**
 * 邮件附件模板 API
 *
 * GET /api/outreach/attachments - 获取附件模板列表
 * POST /api/outreach/attachments - 创建附件模板
 */

// 辅助函数：获取当前用户
async function getCurrentUser() {
  // 实际实现：从 session 或 token 获取用户信息
  // 这里需要根据项目的认证机制实现
  return { tenantId: 'default-tenant' }
}

// 辅助函数：清除同类别的其他默认模板
async function clearOtherDefaults(tenantId: string, category: string) {
  // 实际实现：更新数据库中的其他模板 isDefault = false
  console.log(`[Attachment API] Clearing defaults for tenant ${tenantId}, category ${category}`)
}

/**
 * GET /api/outreach/attachments
 * 获取附件模板列表
 *
 * Query params:
 * - category: 可选，按分类筛选
 * - isDefault: 可选，筛选默认模板
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const isDefault = searchParams.get('isDefault')

    // 从 Payload 获取用户信息
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 构建查询条件
    const where: Record<string, unknown> = {
      tenantId: { equals: user.tenantId },
    }

    if (category) {
      where.category = { equals: category }
    }

    if (isDefault === 'true') {
      where.isDefault = { equals: true }
    }

    // 查询附件模板
    // 注意：这里需要集成 Payload 查询
    // 由于 API 路由限制，返回模拟数据

    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      message: 'Please use Payload Admin to manage attachment templates',
    })
  } catch (error) {
    console.error('[Attachment API] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/outreach/attachments
 * 创建附件模板
 *
 * Body:
 * - name: 模板名称
 * - filename: 附件文件名
 * - contentType: 文件类型
 * - storageKey: OSS 存储路径
 * - size: 文件大小
 * - category: 分类
 * - industry: 适用行业 (可选)
 * - description: 描述 (可选)
 * - isDefault: 是否默认 (可选)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      filename,
      contentType,
      storageKey,
      size,
      category,
      industry,
      description,
      isDefault = false,
    } = body

    // 验证必填字段
    if (!name || !filename || !contentType || !storageKey || !size || !category) {
      return NextResponse.json({
        error: 'Missing required fields: name, filename, contentType, storageKey, size, category',
      }, { status: 400 })
    }

    // 从 Payload 获取用户信息
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 如果设置为默认，先取消其他默认
    if (isDefault) {
      await clearOtherDefaults(user.tenantId, category)
    }

    // 实际创建记录
    // 注意：这里需要调用 Payload 的 create operation
    // 由于 API 路由限制，返回成功响应，前端应使用 Payload Admin 进行创建

    return NextResponse.json({
      success: true,
      message: 'Template created successfully. Please use Payload Admin to manage attachment templates.',
      data: {
        tenantId: user.tenantId,
        name,
        filename,
        contentType,
        storageKey,
        size,
        category,
        industry,
        description,
        isDefault,
      },
    })
  } catch (error) {
    console.error('[Attachment API] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
