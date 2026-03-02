import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload/payload.config'
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
      return NextResponse.json({ error: '没有产品数据' }, { status: 404 })
    }

    // Build category path lookup
    const categoryPaths = new Map<string, { l1: string; l2: string; l3: string }>()
    
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
      
      // Build row data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod = product as any
      const row: Record<string, string | number> = {
        'SKU': product.sku as string || '',
        'Name': product.name as string || '',
        'L1 Category': catPath.l1,
        'L2 Category': catPath.l2,
        'L3 Category': catPath.l3,
        'Short Description': product.shortDescription as string || '',
        'Full Description': '', // Skip richText for now
        'Primary Image URL': primaryImageUrl,
        'Additional Images': (prod.additionalImageUrls as string[] || []).join(', '),
        'Price (USD)': pricing?.basePrice as number || '',
        'Min Order Qty': product.minOrderQuantity as number || 1,
        'Package Qty': product.packageQty as number || '',
        'Package Unit': product.packageUnit as string || '',
        'Lead Time': product.leadTime as string || '',
        'Availability': product.availability as string || '',
        'Status': product.status as string || '',
        'Purchase Mode': product.purchaseMode as string || '',
        'Brand': brand?.name as string || '',
      }

      // Add specifications (up to 9)
      if (specs && Array.isArray(specs)) {
        for (let i = 0; i < 9; i++) {
          const spec = specs[i]
          row[`Spec ${i + 1} Name`] = spec?.label || ''
          row[`Spec ${i + 1} Value`] = spec?.value || ''
        }
      } else {
        for (let i = 0; i < 9; i++) {
          row[`Spec ${i + 1} Name`] = ''
          row[`Spec ${i + 1} Value`] = ''
        }
      }

      row['Meta Title'] = seo?.metaTitle as string || ''
      row['Meta Description'] = seo?.metaDescription as string || ''
      row['Source URL'] = prod.sourceUrl as string || ''

      return row
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 },  // SKU
      { wch: 60 },  // Name
      { wch: 20 },  // L1
      { wch: 25 },  // L2
      { wch: 25 },  // L3
      { wch: 50 },  // Short Desc
      { wch: 50 },  // Full Desc
      { wch: 40 },  // Primary Image
      { wch: 40 },  // Additional Images
      { wch: 12 },  // Price
      { wch: 12 },  // Min Order
      { wch: 12 },  // Pkg Qty
      { wch: 12 },  // Pkg Unit
      { wch: 15 },  // Lead Time
      { wch: 15 },  // Availability
      { wch: 10 },  // Status
      { wch: 18 },  // Purchase Mode
      { wch: 20 },  // Brand
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
      { error: error instanceof Error ? error.message : '导出失败' },
      { status: 500 }
    )
  }
}
