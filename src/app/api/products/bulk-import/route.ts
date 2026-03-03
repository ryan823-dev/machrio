import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import * as XLSX from 'xlsx'

// v3 template format with 40 columns (added Brand, Cost Price, Selling Price, Attribute 1-9)
interface ProductRowV2 {
  'SKU': string
  'Name': string
  'Brand'?: string
  'L1 Category'?: string
  'L2 Category'?: string
  'L3 Category'?: string
  'Short Description': string
  'Full Description'?: string
  'Primary Image URL'?: string
  'Additional Images'?: string
  // v2 price columns
  'Cost Price (USD)'?: string | number
  'Selling Price (USD)'?: string | number
  // Legacy price column (backward compatibility)
  'Price (USD)'?: string | number
  'Min Order Qty'?: string | number
  'Package Qty'?: string | number
  'Package Unit'?: string
  'Lead Time'?: string
  'Availability'?: string
  'Status'?: string
  'Purchase Mode'?: string
  // v2 attribute columns
  'Attribute 1 Name'?: string
  'Attribute 1 Value'?: string
  'Attribute 2 Name'?: string
  'Attribute 2 Value'?: string
  'Attribute 3 Name'?: string
  'Attribute 3 Value'?: string
  'Attribute 4 Name'?: string
  'Attribute 4 Value'?: string
  'Attribute 5 Name'?: string
  'Attribute 5 Value'?: string
  'Attribute 6 Name'?: string
  'Attribute 6 Value'?: string
  'Attribute 7 Name'?: string
  'Attribute 7 Value'?: string
  'Attribute 8 Name'?: string
  'Attribute 8 Value'?: string
  'Attribute 9 Name'?: string
  'Attribute 9 Value'?: string
  // Legacy spec columns (backward compatibility)
  'Spec 1 Name'?: string
  'Spec 1 Value'?: string
  'Spec 2 Name'?: string
  'Spec 2 Value'?: string
  'Spec 3 Name'?: string
  'Spec 3 Value'?: string
  'Spec 4 Name'?: string
  'Spec 4 Value'?: string
  'Spec 5 Name'?: string
  'Spec 5 Value'?: string
  'Spec 6 Name'?: string
  'Spec 6 Value'?: string
  'Spec 7 Name'?: string
  'Spec 7 Value'?: string
  'Spec 8 Name'?: string
  'Spec 8 Value'?: string
  'Spec 9 Name'?: string
  'Spec 9 Value'?: string
  'Meta Title'?: string
  'Meta Description'?: string
  'Source URL'?: string
  // Legacy fields for backward compatibility
  name?: string
  sku?: string
  shortDescription?: string
  primaryCategory?: string
  brand?: string
}

function parsePackageQty(name: string): number | null {
  const patterns = [
    /Pkg\s+Qty\s+(\d+)/i,
    /Pack\s+of\s+(\d+)/i,
    /(\d+)[\s-]*Pack\b/i,
    /Box\s+of\s+(\d+)/i,
    /(\d+)[\s-]*(?:pcs?|pieces?)\b/i,
    /Case\s+of\s+(\d+)/i,
    /(\d+)[\s-]*(?:Rolls?|Count)\b/i,
  ]
  for (const pattern of patterns) {
    const match = name.match(pattern)
    if (match) {
      const qty = parseInt(match[1], 10)
      if (qty > 1) return qty
    }
  }
  return null
}

function mapAvailability(value?: string): 'in-stock' | 'made-to-order' | 'contact' {
  if (!value) return 'contact'
  const v = value.toLowerCase().trim()
  if (v.includes('in stock') || v === 'in-stock') return 'in-stock'
  if (v.includes('made to order') || v.includes('custom') || v === 'made-to-order') return 'made-to-order'
  return 'contact'
}

function mapStatus(value?: string): 'draft' | 'published' | 'discontinued' {
  if (!value) return 'draft'
  const v = value.toLowerCase().trim()
  if (v === 'active' || v === 'published') return 'published'
  if (v === 'discontinued') return 'discontinued'
  return 'draft'
}

function mapPurchaseMode(value?: string): 'both' | 'buy-online' | 'rfq-only' {
  if (!value) return 'both'
  const v = value.toLowerCase().trim()
  if (v.includes('rfq only') || v === 'rfq-only') return 'rfq-only'
  if (v.includes('buy online') && !v.includes('rfq')) return 'buy-online'
  return 'both'
}

function extractSpecifications(row: ProductRowV2): Array<{ label: string; value: string }> {
  const specs: Array<{ label: string; value: string }> = []
  for (let i = 1; i <= 9; i++) {
    // v2 format: Attribute X Name/Value; legacy: Spec X Name/Value
    const attrNameKey = `Attribute ${i} Name` as keyof ProductRowV2
    const attrValueKey = `Attribute ${i} Value` as keyof ProductRowV2
    const specNameKey = `Spec ${i} Name` as keyof ProductRowV2
    const specValueKey = `Spec ${i} Value` as keyof ProductRowV2
    const name = row[attrNameKey] || row[specNameKey]
    const value = row[attrValueKey] || row[specValueKey]
    if (name && value && typeof name === 'string' && typeof value === 'string') {
      specs.push({ label: name.trim(), value: value.trim() })
    }
  }
  return specs
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
    
    // Find products sheet
    const sheetName = workbook.SheetNames.find(n => 
      n.toLowerCase().includes('product')
    ) || workbook.SheetNames[0]
    
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<ProductRowV2>(worksheet)

    // Filter out description row and empty rows
    const dataRows = rows.filter(row => {
      const sku = row['SKU'] || row.sku || ''
      // Skip rows where SKU looks like a description
      return sku && !sku.toLowerCase().includes('unique') && !sku.toLowerCase().includes('product id')
    })

    if (dataRows.length === 0) {
      return NextResponse.json({ error: '表格中没有有效数据' }, { status: 400 })
    }

    // Get all categories for L1/L2/L3 path lookup
    const categories = await payload.find({
      collection: 'categories',
      limit: 1000,
    })

    // Build category lookup maps
    const catById = new Map(categories.docs.map(c => [c.id, c]))
    const catByName = new Map(categories.docs.map(c => [c.name?.toLowerCase(), c]))
    const catBySlug = new Map(categories.docs.map(c => [c.slug, c]))

    // Build L1|L2|L3 path -> category mapping
    const pathToCategory = new Map<string, typeof categories.docs[0]>()
    
    for (const cat of categories.docs) {
      // Determine category level
      if (!cat.parent) continue // Skip L1 categories for product assignment
      
      const parent = catById.get(typeof cat.parent === 'object' ? cat.parent.id : cat.parent)
      if (!parent) continue
      
      // Check if this is L3 (has grandparent)
      if (parent.parent) {
        const grandparent = catById.get(typeof parent.parent === 'object' ? parent.parent.id : parent.parent)
        if (grandparent) {
          // This is an L3 category
          const pathKey = `${grandparent.name?.toLowerCase()}|${parent.name?.toLowerCase()}|${cat.name?.toLowerCase()}`
          pathToCategory.set(pathKey, cat)
        }
      }
    }

    // Get brands for lookup
    const brands = await payload.find({
      collection: 'brands',
      limit: 1000,
    })
    const brandMap = new Map(brands.docs.map(b => [b.name?.toLowerCase(), b.id]))

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; sku: string; error: string }[],
    }

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header)

      // Support both new v2 format and legacy format
      const sku = row['SKU'] || row.sku || ''
      const name = row['Name'] || row.name || ''
      const shortDescription = row['Short Description'] || row.shortDescription || ''

      try {
        // Validate required fields
        if (!name || !sku || !shortDescription) {
          results.errors.push({
            row: rowNum,
            sku: sku || '未知',
            error: '缺少必填字段: SKU, Name, Short Description',
          })
          results.failed++
          continue
        }

        // Find category by L1/L2/L3 path
        let categoryId: string | null = null
        const l1 = row['L1 Category']?.toLowerCase() || ''
        const l2 = row['L2 Category']?.toLowerCase() || ''
        const l3 = row['L3 Category']?.toLowerCase() || ''

        if (l3) {
          // Try exact path match first
          const pathKey = `${l1}|${l2}|${l3}`
          const pathMatch = pathToCategory.get(pathKey)
          if (pathMatch) {
            categoryId = pathMatch.id
          } else {
            // Fallback: try name match for L3
            const nameMatch = catByName.get(l3)
            if (nameMatch) {
              categoryId = nameMatch.id
            } else {
              // Fallback: try slug match
              const slug = l3.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              const slugMatch = catBySlug.get(slug)
              if (slugMatch) {
                categoryId = slugMatch.id
              }
            }
          }
        } else if (row.primaryCategory) {
          // Legacy format: single primaryCategory field
          const legacyMatch = catByName.get(row.primaryCategory.toLowerCase())
          if (legacyMatch) {
            categoryId = legacyMatch.id
          }
        }

        if (!categoryId) {
          results.errors.push({
            row: rowNum,
            sku,
            error: `分类不存在: ${l3 || row.primaryCategory || '未指定'}`,
          })
          results.failed++
          continue
        }

        // Check if product already exists
        const existing = await payload.find({
          collection: 'products',
          where: { sku: { equals: sku } },
          limit: 1,
        })

        // Extract specifications from Spec 1-9 columns
        const specifications = extractSpecifications(row)

        // Parse price - v2: Selling Price (USD), legacy: Price (USD)
        const priceValue = row['Selling Price (USD)'] || row['Price (USD)']
        const basePrice = priceValue ? parseFloat(String(priceValue)) : null

        // Parse cost price (v2 only)
        const costPriceValue = row['Cost Price (USD)']
        const costPrice = costPriceValue ? parseFloat(String(costPriceValue)) : null

        // Parse quantities
        const minOrderQty = row['Min Order Qty'] ? parseInt(String(row['Min Order Qty']), 10) : 1
        const explicitPackageQty = row['Package Qty'] ? parseInt(String(row['Package Qty']), 10) : null
        const parsedPackageQty = parsePackageQty(name)
        const packageQty = (explicitPackageQty && explicitPackageQty > 0) ? explicitPackageQty : parsedPackageQty

        // Parse additional images
        const additionalImages = row['Additional Images']
          ? String(row['Additional Images']).split(',').map(url => url.trim()).filter(Boolean)
          : []

        // Build product data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productData: any = {
          name,
          sku,
          shortDescription,
          primaryCategory: categoryId,
          status: mapStatus(row['Status']),
          availability: mapAvailability(row['Availability']),
          purchaseMode: mapPurchaseMode(row['Purchase Mode']),
          leadTime: row['Lead Time'] || '2-3 weeks',
          minOrderQuantity: minOrderQty || 1,
          externalImageUrl: row['Primary Image URL'] || undefined,
          additionalImageUrls: additionalImages.length > 0 ? additionalImages : undefined,
          specifications: specifications.length > 0 ? specifications : undefined,
        }

        // Add package info
        if (packageQty && packageQty > 1) {
          productData.packageQty = packageQty
        }
        if (row['Package Unit']) {
          productData.packageUnit = row['Package Unit']
        }

        // Add pricing
        if ((basePrice && !isNaN(basePrice)) || (costPrice && !isNaN(costPrice))) {
          productData.pricing = {
            currency: 'USD',
            priceUnit: (row['Package Unit'] || 'each').toLowerCase(),
          }
          if (basePrice && !isNaN(basePrice)) {
            productData.pricing.basePrice = basePrice
          }
          if (costPrice && !isNaN(costPrice)) {
            productData.pricing.costPrice = costPrice
          }
        }

        // Add SEO fields
        if (row['Meta Title'] || row['Meta Description']) {
          productData.meta = {
            title: row['Meta Title'] || `${name} | Machrio`,
            description: row['Meta Description'] || shortDescription.substring(0, 160),
          }
        }

        // Add source URL (for tracking original product source)
        if (row['Source URL']) {
          productData.sourceUrl = row['Source URL']
        }

        // Add fullDescription as Lexical format if provided
        const fullDesc = row['Full Description']
        if (fullDesc) {
          // Check if it's HTML content
          const isHtml = /<[a-z][\s\S]*>/i.test(fullDesc)
          productData.fullDescription = {
            root: {
              type: 'root',
              children: [{ 
                type: 'paragraph', 
                version: 1,
                children: [{ 
                  type: isHtml ? 'html' : 'text', 
                  text: fullDesc, 
                  version: 1 
                }] 
              }],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          }
        }

        // Handle brand - v3: Brand column; legacy: brand field
        const brandName = row['Brand'] || row.brand
        if (brandName) {
          const brandId = brandMap.get(brandName.toLowerCase())
          if (brandId) {
            productData.brand = brandId
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
          sku: sku || '未知',
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
