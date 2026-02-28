// Payload Product Import Script
// Run with: npx tsx scripts/payload-import.ts

import { getPayload } from 'payload'
import config from '../src/payload/payload.config'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ImportProduct {
  name: string
  slug: string
  sku: string
  status: string
  categorySlug: string
  brand: string | null
  shortDescription: string
  fullDescription: string
  primaryImage: string
  additionalImages: string[]
  purchaseMode: string
  pricing: {
    basePrice: number
    costPrice: number
    priceUnit: string
    currency: string
    tieredPricing: Array<{
      minQty: number
      maxQty?: number
      unitPrice: number
    }>
  }
  availability: string
  minOrderQuantity: number
  specifications: Array<{ label: string; value: string }>
  originalId: string
  weight: number
  weightUnit: string
}

// Convert HTML to Lexical richText format
const htmlToRichText = (html: string) => {
  // Strip HTML tags for plain text version
  const plainText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  // Split into paragraphs by double newlines or significant breaks
  const paragraphs = plainText.split(/\n\n+/).filter(p => p.trim().length > 0)
  
  // If no paragraphs, use the whole text as one paragraph
  const textBlocks = paragraphs.length > 0 ? paragraphs : [plainText]

  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      children: textBlocks.slice(0, 10).map(text => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal' as const,
            text: text.trim().substring(0, 2000), // Limit paragraph length
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

// Simple richText helper for brand descriptions
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

async function importProducts() {
  console.log('=== MROworks Payload Import ===\n')

  // Read import data
  const importPath = path.join(__dirname, 'import-data.json')
  if (!fs.existsSync(importPath)) {
    console.error('Error: import-data.json not found. Run import-products.cjs first.')
    process.exit(1)
  }

  const products: ImportProduct[] = JSON.parse(fs.readFileSync(importPath, 'utf-8'))
  console.log(`Loaded ${products.length} products from import-data.json\n`)

  // Connect to Payload
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config })
  console.log('Connected!\n')

  // Get existing categories
  console.log('Loading categories...')
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 100,
    pagination: false,
  })
  const categoryMap: Record<string, string> = {}
  for (const cat of categoriesResult.docs) {
    categoryMap[cat.slug] = cat.id
  }
  console.log(`Found ${Object.keys(categoryMap).length} categories:`, Object.keys(categoryMap).join(', '))

  // Get existing brands
  console.log('\nLoading brands...')
  const brandsResult = await payload.find({
    collection: 'brands',
    limit: 100,
    pagination: false,
  })
  const brandMap: Record<string, string> = {}
  for (const brand of brandsResult.docs) {
    brandMap[brand.slug] = brand.id
    brandMap[brand.name.toLowerCase()] = brand.id
  }
  console.log(`Found ${Object.keys(brandMap).length / 2} brands`)

  // Track created brands for reuse
  const createdBrands: Record<string, string> = {}

  // Create default brand for products without brand
  let defaultBrandId = brandMap['generic'] || brandMap['unbranded']
  if (!defaultBrandId) {
    console.log('\nCreating default brand "Unbranded"...')
    const defaultBrand = await payload.create({
      collection: 'brands',
      data: {
        name: 'Unbranded',
        slug: 'unbranded',
        description: richText('Generic and unbranded industrial products that meet quality standards without specific brand affiliation.'),
        featured: false,
      },
    })
    defaultBrandId = defaultBrand.id
    brandMap['unbranded'] = defaultBrandId
  }

  // Import products
  console.log('\n--- Starting Product Import ---\n')
  
  let imported = 0
  let skipped = 0
  let updated = 0
  let errors = 0
  const errorDetails: string[] = []

  for (const product of products) {
    try {
      // Check if product already exists by SKU
      const existing = await payload.find({
        collection: 'products',
        where: { sku: { equals: product.sku } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        // Update pricing on existing products
        try {
          await payload.update({
            collection: 'products',
            id: existing.docs[0].id,
            data: {
              pricing: {
                basePrice: product.pricing.basePrice,
                priceUnit: product.pricing.priceUnit,
                currency: 'USD',
                tieredPricing: product.pricing.tieredPricing,
              },
            },
          })
          updated++
        } catch {
          // ignore update errors
        }
        skipped++
        continue
      }

      // Resolve category
      const categoryId = categoryMap[product.categorySlug]
      if (!categoryId) {
        console.log(`  Warning: Category "${product.categorySlug}" not found for ${product.sku}, using "safety"`)
      }
      const finalCategoryId = categoryId || categoryMap['safety']

      // Resolve brand
      let brandId = defaultBrandId
      if (product.brand) {
        const brandSlug = product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        brandId = brandMap[brandSlug] || brandMap[product.brand.toLowerCase()] || createdBrands[brandSlug]
        
        if (!brandId) {
          // Create new brand
          try {
            const newBrand = await payload.create({
              collection: 'brands',
              data: {
                name: product.brand,
                slug: brandSlug,
                description: richText(`${product.brand} is a trusted supplier of industrial products for MRO applications.`),
                featured: false,
              },
            })
            brandId = newBrand.id
            brandMap[brandSlug] = brandId
            createdBrands[brandSlug] = brandId
            console.log(`  Created brand: ${product.brand}`)
          } catch (brandError) {
            brandId = defaultBrandId
          }
        }
      }

      // Convert description to richText
      const fullDescription = htmlToRichText(product.fullDescription || product.shortDescription || product.name)

      // Create product
      await payload.create({
        collection: 'products',
        data: {
          name: product.name.substring(0, 200),
          slug: product.slug,
          sku: product.sku,
          status: 'published',
          primaryCategory: finalCategoryId,
          brand: brandId,
          shortDescription: (product.shortDescription || product.name).substring(0, 500),
          fullDescription,
          purchaseMode: 'both',
          pricing: {
            basePrice: product.pricing.basePrice,
            priceUnit: product.pricing.priceUnit,
            currency: 'USD',
            tieredPricing: product.pricing.tieredPricing,
          },
          availability: 'in-stock',
          minOrderQuantity: product.minOrderQuantity || 1,
          specifications: product.specifications?.slice(0, 20) || [],
        },
      })

      imported++
      if (imported % 50 === 0) {
        console.log(`  Imported ${imported} products...`)
      }
    } catch (error: unknown) {
      errors++
      const errorMessage = error instanceof Error ? error.message : String(error)
      errorDetails.push(`${product.sku}: ${errorMessage}`)
      if (errors <= 10) {
        console.log(`  Error importing ${product.sku}: ${errorMessage}`)
      }
    }
  }

  // Summary
  console.log('\n=== Import Summary ===')
  console.log(`Total products: ${products.length}`)
  console.log(`Imported: ${imported}`)
  console.log(`Updated pricing: ${updated}`)
  console.log(`Skipped (already exist): ${skipped}`)
  console.log(`Errors: ${errors}`)

  if (errorDetails.length > 0 && errorDetails.length <= 20) {
    console.log('\nError details:')
    errorDetails.forEach(e => console.log(`  - ${e}`))
  }

  // Verify import
  console.log('\n--- Verification ---')
  const totalProducts = await payload.count({ collection: 'products' })
  console.log(`Total products in database: ${totalProducts.totalDocs}`)

  const productsByCategory = await payload.find({
    collection: 'products',
    limit: 1,
    pagination: false,
  })

  console.log('\n=== Import Complete ===')
  process.exit(0)
}

importProducts().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
