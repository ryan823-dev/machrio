import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  // Create template workbook
  const templateData = [
    {
      name: '示例产品名称',
      sku: 'SKU-001',
      shortDescription: '产品简短描述 (必填，用于产品卡片和SEO)',
      fullDescription: '产品详细描述 (可选，支持更长的文本)',
      primaryCategory: '分类名称 (必须与系统中的分类名称一致)',
      brand: '品牌名称 (必须与系统中的品牌名称一致)',
      basePrice: 99.99,
      status: 'draft',
      availability: 'contact',
      purchaseMode: 'both',
      material: '材料1, 材料2',
      size: 'S, M, L, XL',
      color: '黑色, 白色',
      externalImageUrl: 'https://example.com/image.jpg',
      packageQty: 100,
      packageUnit: 'box',
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateData)
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // name
    { wch: 15 }, // sku
    { wch: 50 }, // shortDescription
    { wch: 50 }, // fullDescription
    { wch: 20 }, // primaryCategory
    { wch: 20 }, // brand
    { wch: 12 }, // basePrice
    { wch: 12 }, // status
    { wch: 15 }, // availability
    { wch: 15 }, // purchaseMode
    { wch: 25 }, // material
    { wch: 20 }, // size
    { wch: 20 }, // color
    { wch: 40 }, // externalImageUrl
    { wch: 12 }, // packageQty
    { wch: 12 }, // packageUnit
  ]

  // Add instructions sheet
  const instructionsData = [
    { 字段: 'name', 说明: '产品名称', 必填: '是', 示例: '安全手套 - 丁腈材质' },
    { 字段: 'sku', 说明: '产品SKU编号 (唯一)', 必填: '是', 示例: 'GLV-NIT-001' },
    { 字段: 'shortDescription', 说明: '简短描述 (50字以上)', 必填: '是', 示例: '高品质丁腈手套...' },
    { 字段: 'fullDescription', 说明: '详细描述 (300字以上)', 必填: '否', 示例: '产品详细介绍...' },
    { 字段: 'primaryCategory', 说明: '主分类名称', 必填: '是', 示例: 'Safety Gloves' },
    { 字段: 'brand', 说明: '品牌名称', 必填: '是', 示例: '3M' },
    { 字段: 'basePrice', 说明: '基础价格 (USD)', 必填: '否', 示例: '12.99' },
    { 字段: 'status', 说明: '状态: draft/published', 必填: '否', 示例: 'draft' },
    { 字段: 'availability', 说明: '库存: in-stock/made-to-order/contact', 必填: '否', 示例: 'contact' },
    { 字段: 'purchaseMode', 说明: '购买方式: both/buy-online/rfq-only', 必填: '否', 示例: 'both' },
    { 字段: 'material', 说明: '材料 (逗号分隔)', 必填: '否', 示例: 'Nitrile, Latex' },
    { 字段: 'size', 说明: '尺寸 (逗号分隔)', 必填: '否', 示例: 'S, M, L, XL' },
    { 字段: 'color', 说明: '颜色 (逗号分隔)', 必填: '否', 示例: 'Blue, Black' },
    { 字段: 'externalImageUrl', 说明: '外部图片URL', 必填: '否', 示例: 'https://...' },
    { 字段: 'packageQty', 说明: '包装数量 (留空则自动从产品名中解析 Pkg Qty)', 必填: '否', 示例: '100' },
    { 字段: 'packageUnit', 说明: '包装单位 (box, case, pack, roll)', 必填: '否', 示例: 'box' },
  ]
  const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData)
  instructionsSheet['!cols'] = [
    { wch: 20 },
    { wch: 40 },
    { wch: 8 },
    { wch: 30 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '产品数据')
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, '字段说明')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="product-import-template.xlsx"',
    },
  })
}
