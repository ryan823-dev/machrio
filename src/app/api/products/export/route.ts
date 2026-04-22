import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
import { normalizePackageUnit } from '@/lib/package-units'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get all products
    const products = await payload.find({
      collection: 'products',
      limit: 10000,
      depth: 2,
    })

    if (products.docs.length === 0) {
      return NextResponse.json({ error: 'No product data found' }, { status: 404 })
    }

    const buildCategoryPath = (cat: Record<string, unknown>): { l1: string; l2: string; l3: string } => {
      if (!cat) return { l1: '', l2: '', l3: '' }
      
      const name = cat.name as string || ''
      const parent = cat.parent as Record<string, unknown> | null
      
      if (!parent) {
        // This is L1
        return { l1: name, l2: '', l3: '' }
      }
      
      const grandparent = parent.parent as Record<string, unknown> | null
      if (!grandparent) {
        // This is L2
        return { l1: parent.name as string || '', l2: name, l3: '' }
      }
      
      // This is L3
      return { 
        l1: grandparent.name as string || '', 
        l2: parent.name as string || '', 
        l3: name 
      }
    }

    // Map products to export format
    const exportData = products.docs.map((product) => {
      const pricing = product.pricing as Record<string, unknown> | undefined
      const seo = product.seo as Record<string, unknown> | undefined
      const specs = product.specifications as Array<{ label: string; value: string; unit?: string }> | undefined
      const primaryCategory = product.primaryCategory as unknown as Record<string, unknown> | null
      const brand = product.brand as unknown as Record<string, unknown> | null
      
      // Resolve category path
      const catPath = primaryCategory ? buildCategoryPath(primaryCategory) : { l1: '', l2: '', l3: '' }
      
      // Resolve image URLs
      const primaryImageObj = product.primaryImage && typeof product.primaryImage === 'object'
        ? product.primaryImage as unknown as Record<string, unknown>
        : null
      const primaryImageUrl = (primaryImageObj?.url as string) || (product.externalImageUrl as string) || ''
      
      // Build row data matching v3 template (40 columns)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = product as any
      const row: Record<string, string | number> = {
        'SKU': product.sku as string || '',
        'Name': product.name as string || '',
        'Brand': brand?.name as string || '',
        'L1 Category': catPath.l1,
        'L2 Category': catPath.l2,
        'L3 Category': catPath.l3,
        'Short Description': product.shortDescription as string || '',
        'Full Description': '', // Skip richText for now
        'Primary Image URL': primaryImageUrl,
        'Additional Images': (prod.additionalImageUrls as string[] || []).join('|'),
        'Cost Price (USD)': pricing?.costPrice as number || '',
        'Selling Price (USD)': pricing?.basePrice as number || '',
        'Min Order Qty': product.minOrderQuantity as number || 1,
        'Package Qty': product.packageQty as number || '',
        'Package Unit': normalizePackageUnit(product.packageUnit as string | null) || '',
        'Lead Time': product.leadTime as string || '',
        'Availability': product.availability as string || '',
        'Status': product.status as string || '',
        'Purchase Mode': product.purchaseMode as string || '',
      }

      // Add specifications/attributes (up to 9) - renamed from Spec to Attribute to match v3 template
      if (specs && Array.isArray(specs)) {
        for (let i = 0; i < 9; i++) {
          const spec = specs[i]
          row[`Attribute ${i + 1} Name`] = spec?.label || ''
          row[`Attribute ${i + 1} Value`] = spec?.value || ''
        }
      } else {
        for (let i = 0; i < 9; i++) {
          row[`Attribute ${i + 1} Name`] = ''
          row[`Attribute ${i + 1} Value`] = ''
        }
      }

      row['Meta Title'] = seo?.metaTitle as string || ''
      row['Meta Description'] = seo?.metaDescription as string || ''
      row['Source URL'] = prod.sourceUrl as string || ''

      // Add FAQ columns (up to 3) - Products collection doesn't have FAQ, leave empty for export template compatibility
      for (let i = 0; i < 3; i++) {
        row[`FAQ Question ${i + 1}`] = ''
        row[`FAQ Answer ${i + 1}`] = ''
      }

      return row
    })

    // Define column order to match v4 template (46 columns)
    const columnOrder = [
      'SKU', 'Name', 'Brand', 'L1 Category', 'L2 Category', 'L3 Category',
      'Short Description', 'Full Description', 'Primary Image URL', 'Additional Images',
      'Cost Price (USD)', 'Selling Price (USD)', 'Min Order Qty', 'Package Qty',
      'Package Unit', 'Lead Time', 'Availability', 'Status', 'Purchase Mode',
      'Attribute 1 Name', 'Attribute 1 Value', 'Attribute 2 Name', 'Attribute 2 Value',
      'Attribute 3 Name', 'Attribute 3 Value', 'Attribute 4 Name', 'Attribute 4 Value',
      'Attribute 5 Name', 'Attribute 5 Value', 'Attribute 6 Name', 'Attribute 6 Value',
      'Attribute 7 Name', 'Attribute 7 Value', 'Attribute 8 Name', 'Attribute 8 Value',
      'Attribute 9 Name', 'Attribute 9 Value', 'Meta Title', 'Meta Description', 'Source URL',
      'FAQ Question 1', 'FAQ Answer 1', 'FAQ Question 2', 'FAQ Answer 2',
      'FAQ Question 3', 'FAQ Answer 3'
    ]

    // Create worksheet with explicit column order
    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: columnOrder })

    // Set column widths for 46 columns
    worksheet['!cols'] = [
      { wch: 15 },  // SKU
      { wch: 60 },  // Name
      { wch: 20 },  // Brand
      { wch: 20 },  // L1 Category
      { wch: 25 },  // L2 Category
      { wch: 25 },  // L3 Category
      { wch: 50 },  // Short Description
      { wch: 50 },  // Full Description
      { wch: 40 },  // Primary Image URL
      { wch: 40 },  // Additional Images
      { wch: 15 },  // Cost Price (USD)
      { wch: 15 },  // Selling Price (USD)
      { wch: 12 },  // Min Order Qty
      { wch: 12 },  // Package Qty
      { wch: 12 },  // Package Unit
      { wch: 15 },  // Lead Time
      { wch: 15 },  // Availability
      { wch: 10 },  // Status
      { wch: 18 },  // Purchase Mode
      { wch: 18 }, { wch: 18 },  // Attribute 1
      { wch: 18 }, { wch: 18 },  // Attribute 2
      { wch: 18 }, { wch: 18 },  // Attribute 3
      { wch: 18 }, { wch: 18 },  // Attribute 4
      { wch: 18 }, { wch: 18 },  // Attribute 5
      { wch: 18 }, { wch: 18 },  // Attribute 6
      { wch: 18 }, { wch: 18 },  // Attribute 7
      { wch: 18 }, { wch: 18 },  // Attribute 8
      { wch: 18 }, { wch: 18 },  // Attribute 9
      { wch: 40 },  // Meta Title
      { wch: 50 },  // Meta Description
      { wch: 50 },  // Source URL
      { wch: 40 },  // FAQ Question 1
      { wch: 60 },  // FAQ Answer 1
      { wch: 40 },  // FAQ Question 2
      { wch: 60 },  // FAQ Answer 2
      { wch: 40 },  // FAQ Question 3
      { wch: 60 },  // FAQ Answer 3
    ]

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Machrio_Products_Export_${timestamp}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
