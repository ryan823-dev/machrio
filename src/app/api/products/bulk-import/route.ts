import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import * as XLSX from 'xlsx'

interface ProductRow {
  name: string
  sku: string
  shortDescription: string
  fullDescription?: string
  primaryCategory: string
  brand: string
  basePrice?: number
  status?: string
  availability?: string
  purchaseMode?: string
  material?: string
  size?: string
  color?: string
  externalImageUrl?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Check authentication
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: '请先登录管理后台' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 })
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<ProductRow>(worksheet)

    if (rows.length === 0) {
      return NextResponse.json({ error: '表格中没有数据' }, { status: 400 })
    }

    // Get all categories and brands for lookup
    const categories = await payload.find({
      collection: 'categories',
      limit: 1000,
    })
    const brands = await payload.find({
      collection: 'brands',
      limit: 1000,
    })

    const categoryMap = new Map(categories.docs.map(c => [c.name?.toLowerCase(), c.id]))
    const brandMap = new Map(brands.docs.map(b => [b.name?.toLowerCase(), b.id]))

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; sku: string; error: string }[],
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header)

      try {
        // Validate required fields
        if (!row.name || !row.sku || !row.shortDescription) {
          results.errors.push({
            row: rowNum,
            sku: row.sku || '未知',
            error: '缺少必填字段: name, sku, shortDescription',
          })
          results.failed++
          continue
        }

        // Lookup category
        const categoryId = categoryMap.get(row.primaryCategory?.toLowerCase())
        if (!categoryId) {
          results.errors.push({
            row: rowNum,
            sku: row.sku,
            error: `分类不存在: ${row.primaryCategory}`,
          })
          results.failed++
          continue
        }

        // Lookup brand
        const brandId = brandMap.get(row.brand?.toLowerCase())
        if (!brandId) {
          results.errors.push({
            row: rowNum,
            sku: row.sku,
            error: `品牌不存在: ${row.brand}`,
          })
          results.failed++
          continue
        }

        // Check if product already exists
        const existing = await payload.find({
          collection: 'products',
          where: { sku: { equals: row.sku } },
          limit: 1,
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productData: any = {
          name: row.name,
          sku: row.sku,
          shortDescription: row.shortDescription,
          primaryCategory: categoryId,
          brand: brandId,
          status: (row.status === 'published' || row.status === 'discontinued' ? row.status : 'draft'),
          availability: (row.availability === 'in-stock' || row.availability === 'made-to-order' ? row.availability : 'contact'),
          purchaseMode: (row.purchaseMode === 'buy-online' || row.purchaseMode === 'rfq-only' ? row.purchaseMode : 'both'),
          pricing: row.basePrice ? {
            basePrice: Number(row.basePrice),
            currency: 'USD',
          } : undefined,
          facets: {
            material: row.material ? row.material.split(',').map(s => s.trim()) : undefined,
            size: row.size ? row.size.split(',').map(s => s.trim()) : undefined,
            color: row.color ? row.color.split(',').map(s => s.trim()) : undefined,
          },
          externalImageUrl: row.externalImageUrl || undefined,
        }
        
        // Add fullDescription as Lexical format if provided
        if (row.fullDescription) {
          productData.fullDescription = {
            root: {
              type: 'root',
              children: [{ 
                type: 'paragraph', 
                version: 1,
                children: [{ type: 'text', text: row.fullDescription, version: 1 }] 
              }],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          }
        }

        if (existing.docs.length > 0) {
          // Update existing product
          await payload.update({
            collection: 'products',
            id: existing.docs[0].id,
            data: productData,
          })
        } else {
          // Create new product
          await payload.create({
            collection: 'products',
            data: productData,
          })
        }

        results.success++
      } catch (error) {
        results.errors.push({
          row: rowNum,
          sku: row.sku || '未知',
          error: error instanceof Error ? error.message : '未知错误',
        })
        results.failed++
      }
    }

    return NextResponse.json({
      message: `导入完成: ${results.success} 成功, ${results.failed} 失败`,
      ...results,
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
}
