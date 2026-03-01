// Excel Product Import Script
// Run with: npx tsx scripts/import-excel-products.ts

import { getPayload } from 'payload'
import config from '../src/payload/payload.config'
import XLSX from 'xlsx'
import * as path from 'path'

const EXCEL_FILES = [
  '/Users/oceanlink/Downloads/产品信息2602251138(1).xlsx',
  '/Users/oceanlink/Downloads/产品信息2602251142.xlsx',
]

interface ExcelRow {
  商品id: string
  商品名称: string
  品牌: string
  '分类(上下级逗号分隔,最多四级/用斜杠分隔多种分类)': string
  商品类型: string
  封面图: string
  供货价: string
  供货价单位: string
  建议销售价: string
  建议销售价单位: string
  计量单位: string
  重量: string
  重量单位: string
  长度: string
  宽度: string
  高度: string
  长度单位: string
  上架: string
  友好链接: string
  简介: string
  详情: string
  meta标题: string
  meta详情: string
  meta关键字: string
  '关联商品id(逗号分隔)': string
  排序: string
}

// Convert HTML to Lexical richText format
const htmlToRichText = (html: string) => {
  if (!html) {
    return {
      root: {
        type: 'root',
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            format: '' as const,
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal' as const,
                text: 'Product description pending.',
                type: 'text',
                format: 0,
                style: '',
                detail: 0,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
            textFormat: 0,
            textStyle: '',
          },
        ],
        direction: 'ltr' as const,
      },
    }
  }

  // Strip HTML tags for plain text version
  const plainText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  const paragraphs = plainText.split(/\n\n+/).filter(p => p.trim().length > 0)
  const textBlocks = paragraphs.length > 0 ? paragraphs : [plainText || 'Product description pending.']

  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      children: textBlocks.slice(0, 15).map(text => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal' as const,
            text: text.trim().substring(0, 3000),
            type: 'text',
            format: 0,
            style: '',
            detail: 0,
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
      })),
      direction: 'ltr' as const,
    },
  }
}

const richText = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal' as const,
            text,
            type: 'text',
            format: 0,
            style: '',
            detail: 0,
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
      },
    ],
    direction: 'ltr' as const,
  },
})

const generateSlug = (name: string, sku: string): string => {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80)
  const skuPart = sku ? `-${sku.toLowerCase().slice(-6)}` : ''
  return `${baseSlug}${skuPart}`
}

const generateCategorySlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function importFromExcel() {
  console.log('=== Excel Product Import ===\n')

  // Load Excel files
  console.log('Loading Excel files...')
  const allRows: ExcelRow[] = []

  for (const filePath of EXCEL_FILES) {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' })
    console.log(`  ${path.basename(filePath)}: ${rows.length} rows`)
    allRows.push(...rows)
  }

  console.log(`Total products to import: ${allRows.length}\n`)

  // Connect to Payload
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config })
  console.log('Connected!\n')

  // Step 1: Delete all existing products
  console.log('=== Step 1: Clear Existing Products ===')
  const existingProducts = await payload.find({
    collection: 'products',
    limit: 10000,
    pagination: false,
  })
  console.log(`Found ${existingProducts.docs.length} existing products`)

  if (existingProducts.docs.length > 0) {
    console.log('Deleting existing products...')
    let deleted = 0
    for (const product of existingProducts.docs) {
      await payload.delete({
        collection: 'products',
        id: product.id,
      })
      deleted++
      if (deleted % 100 === 0) {
        console.log(`  Deleted ${deleted}...`)
      }
    }
    console.log(`Deleted ${deleted} products\n`)
  }

  // Step 2: Build category hierarchy
  console.log('=== Step 2: Create Categories ===')
  const categoryPaths = new Set<string>()
  for (const row of allRows) {
    const catPath = row['分类(上下级逗号分隔,最多四级/用斜杠分隔多种分类)']
    if (catPath) {
      categoryPaths.add(catPath.trim())
    }
  }

  // Parse hierarchy
  interface CategoryNode {
    name: string
    slug: string
    parent?: string
    level: number
  }

  const categoryNodes: Map<string, CategoryNode> = new Map()

  for (const path of categoryPaths) {
    const parts = path.split(',').map(p => p.trim())
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const slug = generateCategorySlug(name)
      const fullPath = parts.slice(0, i + 1).join(' > ')

      if (!categoryNodes.has(fullPath)) {
        const parentPath = i > 0 ? parts.slice(0, i).join(' > ') : undefined
        categoryNodes.set(fullPath, {
          name,
          slug,
          parent: parentPath,
          level: i + 1,
        })
      }
    }
  }

  console.log(`Found ${categoryNodes.size} unique categories`)

  // Get existing categories
  const existingCats = await payload.find({
    collection: 'categories',
    limit: 500,
    pagination: false,
  })
  const existingCatMap: Record<string, string> = {}
  for (const cat of existingCats.docs) {
    existingCatMap[cat.slug] = cat.id
    existingCatMap[cat.name] = cat.id
  }
  console.log(`Existing categories in DB: ${existingCats.docs.length}`)

  // Create categories level by level
  const categoryIdMap: Record<string, string> = { ...existingCatMap }

  for (let level = 1; level <= 4; level++) {
    const levelCats = Array.from(categoryNodes.values()).filter(c => c.level === level)
    console.log(`Creating level ${level} categories (${levelCats.length})...`)

    for (const cat of levelCats) {
      // Skip if already exists
      if (categoryIdMap[cat.slug] || categoryIdMap[cat.name]) {
        const existingId = categoryIdMap[cat.slug] || categoryIdMap[cat.name]
        categoryIdMap[cat.slug] = existingId
        categoryIdMap[cat.name] = existingId
        continue
      }

      // Find parent ID
      let parentId: string | undefined
      if (cat.parent) {
        const parentNode = categoryNodes.get(cat.parent)
        if (parentNode) {
          parentId = categoryIdMap[parentNode.slug] || categoryIdMap[parentNode.name]
        }
      }

      try {
        const created = await payload.create({
          collection: 'categories',
          data: {
            name: cat.name,
            slug: cat.slug,
            parent: parentId || undefined,
            description: richText(`${cat.name} - Industrial supplies and equipment for professional applications.`),
            shortDescription: `Shop ${cat.name} products`,
            featured: level === 1,
            displayOrder: 0,
          },
        })
        categoryIdMap[cat.slug] = created.id
        categoryIdMap[cat.name] = created.id
        console.log(`  Created: ${cat.name} (level ${level})`)
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        if (msg.includes('duplicate') || msg.includes('unique')) {
          // Try to find by slug
          const found = await payload.find({
            collection: 'categories',
            where: { slug: { equals: cat.slug } },
            limit: 1,
          })
          if (found.docs.length > 0) {
            categoryIdMap[cat.slug] = found.docs[0].id
            categoryIdMap[cat.name] = found.docs[0].id
          }
        } else {
          console.log(`  Error creating ${cat.name}: ${msg}`)
        }
      }
    }
  }

  console.log(`Category map has ${Object.keys(categoryIdMap).length} entries\n`)

  // Step 3: Create default brand
  console.log('=== Step 3: Create Default Brand ===')
  let defaultBrandId = existingCatMap['generic'] || existingCatMap['unbranded']

  const existingBrands = await payload.find({
    collection: 'brands',
    limit: 100,
    pagination: false,
  })
  const brandMap: Record<string, string> = {}
  for (const brand of existingBrands.docs) {
    brandMap[brand.slug] = brand.id
    brandMap[brand.name.toLowerCase()] = brand.id
  }

  defaultBrandId = brandMap['generic'] || brandMap['unbranded']
  if (!defaultBrandId) {
    console.log('Creating default brand "Generic"...')
    const defaultBrand = await payload.create({
      collection: 'brands',
      data: {
        name: 'Generic',
        slug: 'generic',
        description: richText('Generic industrial products meeting quality standards for professional MRO applications. These unbranded items provide reliable performance at competitive prices.'),
        featured: false,
      },
    })
    defaultBrandId = defaultBrand.id
    brandMap['generic'] = defaultBrandId
    console.log(`Created default brand with ID: ${defaultBrandId}`)
  } else {
    console.log(`Using existing brand ID: ${defaultBrandId}`)
  }
  console.log()

  // Step 4: Import products
  console.log('=== Step 4: Import Products ===')
  let imported = 0
  let errors = 0
  const errorDetails: string[] = []
  const usedSlugs = new Set<string>()
  const usedSkus = new Set<string>()

  for (const row of allRows) {
    try {
      const productId = row['商品id'] || `auto-${imported + 1}`
      const name = row['商品名称']
      if (!name) {
        errors++
        errorDetails.push(`Row ${imported + 1}: Missing product name`)
        continue
      }

      // Generate unique SKU
      let sku = `MACH-${productId}`
      let skuCounter = 0
      while (usedSkus.has(sku)) {
        skuCounter++
        sku = `MACH-${productId}-${skuCounter}`
      }
      usedSkus.add(sku)

      // Generate unique slug
      let slug = row['友好链接'] || generateSlug(name, sku)
      let slugCounter = 0
      while (usedSlugs.has(slug)) {
        slugCounter++
        slug = `${generateSlug(name, sku)}-${slugCounter}`
      }
      usedSlugs.add(slug)

      // Get category
      const catPath = row['分类(上下级逗号分隔,最多四级/用斜杠分隔多种分类)']
      let categoryId: string | undefined
      if (catPath) {
        const parts = catPath.split(',').map(p => p.trim())
        // Use the most specific (last) category
        for (let i = parts.length - 1; i >= 0; i--) {
          const catName = parts[i]
          const catSlug = generateCategorySlug(catName)
          if (categoryIdMap[catSlug] || categoryIdMap[catName]) {
            categoryId = categoryIdMap[catSlug] || categoryIdMap[catName]
            break
          }
        }
      }

      if (!categoryId) {
        // Use first available category
        categoryId = Object.values(categoryIdMap)[0]
      }

      // Parse price
      let basePrice = 0
      const priceStr = row['建议销售价']
      if (priceStr) {
        basePrice = parseFloat(priceStr) || 0
      }
      const currency = row['建议销售价单位'] === 'CNY' ? 'USD' : 'USD'
      // Convert CNY to USD if needed (rough estimate)
      if (row['建议销售价单位'] === 'CNY' && basePrice > 0) {
        basePrice = Math.round(basePrice / 7.2 * 100) / 100
      }

      // Parse weight
      let weight: number | undefined
      if (row['重量']) {
        weight = parseFloat(row['重量']) || undefined
      }

      // Short description - strip HTML
      let shortDesc = row['简介'] || name
      shortDesc = shortDesc
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500)

      // Full description
      const fullDesc = htmlToRichText(row['详情'] || row['简介'] || name)

      // Create product
      await payload.create({
        collection: 'products',
        data: {
          name: name.substring(0, 200),
          slug,
          sku,
          status: 'published',
          primaryCategory: categoryId,
          brand: defaultBrandId,
          shortDescription: shortDesc,
          fullDescription: fullDesc,
          externalImageUrl: row['封面图'] || undefined,
          purchaseMode: 'both',
          pricing: {
            basePrice: basePrice > 0 ? basePrice : undefined,
            priceUnit: row['计量单位'] || 'each',
            currency,
          },
          availability: 'in-stock',
          minOrderQuantity: 1,
          shippingInfo: {
            weight: weight,
            processingTime: 3,
          },
          seo: {
            metaTitle: row['meta标题'] || undefined,
            metaDescription: row['meta详情'] || undefined,
            focusKeyword: row['meta关键字'] || undefined,
          },
        },
      })

      imported++
      if (imported % 100 === 0) {
        console.log(`  Imported ${imported} products...`)
      }
    } catch (error: unknown) {
      errors++
      const msg = error instanceof Error ? error.message : String(error)
      errorDetails.push(`${row['商品id']}: ${msg.substring(0, 100)}`)
      if (errors <= 5) {
        console.log(`  Error: ${row['商品名称']?.substring(0, 50)}: ${msg.substring(0, 100)}`)
      }
    }
  }

  // Summary
  console.log('\n=== Import Summary ===')
  console.log(`Total rows: ${allRows.length}`)
  console.log(`Successfully imported: ${imported}`)
  console.log(`Errors: ${errors}`)

  if (errorDetails.length > 0 && errorDetails.length <= 20) {
    console.log('\nError details:')
    errorDetails.slice(0, 20).forEach(e => console.log(`  - ${e}`))
  }

  // Verify
  console.log('\n=== Verification ===')
  const totalProducts = await payload.count({ collection: 'products' })
  const totalCategories = await payload.count({ collection: 'categories' })
  console.log(`Products in database: ${totalProducts.totalDocs}`)
  console.log(`Categories in database: ${totalCategories.totalDocs}`)

  console.log('\n=== Import Complete ===')
  process.exit(0)
}

importFromExcel().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
