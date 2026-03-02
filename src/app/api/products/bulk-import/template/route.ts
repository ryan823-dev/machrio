import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// Template headers matching Machrio_Import_Template.xlsx (37 columns)
const HEADERS = [
  { key: 'SKU', desc: 'Unique product ID' },
  { key: 'Name', desc: 'Product title, max 120 chars' },
  { key: 'L1 Category', desc: 'Top level category name' },
  { key: 'L2 Category', desc: 'Second level category name' },
  { key: 'L3 Category', desc: 'Third level category name' },
  { key: 'Short Description', desc: '50-100 words summary' },
  { key: 'Full Description', desc: '200-500 words, supports HTML' },
  { key: 'Primary Image URL', desc: 'Main product image URL' },
  { key: 'Additional Images', desc: 'Comma-separated image URLs' },
  { key: 'Price (USD)', desc: 'Base price in USD' },
  { key: 'Min Order Qty', desc: 'Minimum order quantity' },
  { key: 'Package Qty', desc: 'Items per package' },
  { key: 'Package Unit', desc: 'Each/Pair/Box/Case/Roll' },
  { key: 'Lead Time', desc: '2-3 weeks / In Stock / etc' },
  { key: 'Availability', desc: 'In Stock / Made to Order' },
  { key: 'Status', desc: 'Draft / Active' },
  { key: 'Purchase Mode', desc: 'Buy Online + RFQ / RFQ Only' },
  { key: 'Spec 1 Name', desc: 'Specification attribute name' },
  { key: 'Spec 1 Value', desc: 'Specification attribute value' },
  { key: 'Spec 2 Name', desc: 'Specification attribute name' },
  { key: 'Spec 2 Value', desc: 'Specification attribute value' },
  { key: 'Spec 3 Name', desc: 'Specification attribute name' },
  { key: 'Spec 3 Value', desc: 'Specification attribute value' },
  { key: 'Spec 4 Name', desc: 'Specification attribute name' },
  { key: 'Spec 4 Value', desc: 'Specification attribute value' },
  { key: 'Spec 5 Name', desc: 'Specification attribute name' },
  { key: 'Spec 5 Value', desc: 'Specification attribute value' },
  { key: 'Spec 6 Name', desc: 'Specification attribute name' },
  { key: 'Spec 6 Value', desc: 'Specification attribute value' },
  { key: 'Spec 7 Name', desc: 'Specification attribute name' },
  { key: 'Spec 7 Value', desc: 'Specification attribute value' },
  { key: 'Spec 8 Name', desc: 'Specification attribute name' },
  { key: 'Spec 8 Value', desc: 'Specification attribute value' },
  { key: 'Spec 9 Name', desc: 'Specification attribute name' },
  { key: 'Spec 9 Value', desc: 'Specification attribute value' },
  { key: 'Meta Title', desc: 'SEO title, max 70 chars + | Machrio' },
  { key: 'Meta Description', desc: 'SEO description, max 160 chars' },
]

// Sample product data
const SAMPLE_PRODUCT: Record<string, string> = {
  'SKU': 'MACH-HP4853',
  'Name': 'Cut Resistant Gloves, ANSI A4 / EN 388:2016, Size 9, Nitrile Coated, HPPE/Glass Fiber, Pkg Qty 12',
  'L1 Category': 'Safety',
  'L2 Category': 'Hand & Arm Protection',
  'L3 Category': 'Safety Gloves',
  'Short Description': 'Cut-resistant safety gloves with ANSI A4 rating and nitrile palm coating for secure grip in wet or oily conditions. Constructed with HPPE fiber and seamless knit design for comfort during extended wear.',
  'Full Description': '<p>These Cut Resistant Gloves provide ANSI Cut Level A4 protection, ideal for handling sharp materials in manufacturing, glass handling, and metal fabrication.</p><h3>Key Features</h3><ul><li>ANSI A4 cut resistance rating</li><li>Nitrile palm coating for enhanced grip</li><li>HPPE and glass fiber construction</li><li>Seamless knit design for comfort</li></ul>',
  'Primary Image URL': 'https://example.com/images/HP4853.jpg',
  'Additional Images': '',
  'Price (USD)': '49.99',
  'Min Order Qty': '1',
  'Package Qty': '12',
  'Package Unit': 'Pair',
  'Lead Time': '2-3 weeks',
  'Availability': 'In Stock',
  'Status': 'Draft',
  'Purchase Mode': 'Buy Online + RFQ',
  'Spec 1 Name': 'Size',
  'Spec 1 Value': '9',
  'Spec 2 Name': 'Material',
  'Spec 2 Value': 'HPPE and Glass Fiber Blend',
  'Spec 3 Name': 'Standards',
  'Spec 3 Value': 'EN 388:2016',
  'Spec 4 Name': 'ANSI/ISEA Rating',
  'Spec 4 Value': 'A4',
  'Spec 5 Name': 'Coating',
  'Spec 5 Value': 'Nitrile',
  'Spec 6 Name': 'Cuff Style',
  'Spec 6 Value': 'Knit Wrist',
  'Spec 7 Name': 'Glove Length',
  'Spec 7 Value': '10 inches',
  'Spec 8 Name': 'Color',
  'Spec 8 Value': 'Gray/Black',
  'Spec 9 Name': '',
  'Spec 9 Value': '',
  'Meta Title': 'Cut Resistant Gloves, ANSI A4 / EN 388:2016, Size 9 | Machrio',
  'Meta Description': 'Buy Safety Gloves at competitive prices. ANSI A4 rated cut resistant gloves with nitrile coating. Free quotes available. Shop industrial safety supplies at Machrio.com',
}

export async function GET() {
  // Build description row (Row 2 in Excel - field descriptions)
  const descRow: Record<string, string> = {}
  HEADERS.forEach(h => { descRow[h.key] = h.desc })

  // Data array: Row 1 = descriptions, Row 2 = sample product
  const data = [descRow, SAMPLE_PRODUCT]

  // Create worksheet with headers
  const worksheet = XLSX.utils.json_to_sheet(data, { 
    header: HEADERS.map(h => h.key) 
  })

  // Set column widths for better readability
  worksheet['!cols'] = HEADERS.map(h => {
    if (h.key.includes('Description')) return { wch: 50 }
    if (h.key === 'Name') return { wch: 60 }
    if (h.key.includes('URL') || h.key.includes('Images')) return { wch: 40 }
    if (h.key.includes('Meta')) return { wch: 45 }
    if (h.key.includes('Category')) return { wch: 25 }
    return { wch: 18 }
  })

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Machrio_Import_Template.xlsx"',
    },
  })
}
