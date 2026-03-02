/**
 * Generate Machrio Import Template Excel file
 * Creates a properly formatted template with headers and sample row
 * 
 * Usage: node scripts/generate-import-template.cjs
 */
const XLSX = require('xlsx')
const path = require('path')

// Template headers with descriptions
const HEADERS = [
  { key: 'SKU', desc: 'Unique ID' },
  { key: 'Name', desc: 'Product title, max 120 chars' },
  { key: 'L1 Category', desc: 'Top level category' },
  { key: 'L2 Category', desc: 'Second level category' },
  { key: 'L3 Category', desc: 'Third level category' },
  { key: 'Short Description', desc: '50-100 words summary' },
  { key: 'Full Description', desc: '200-500 words HTML' },
  { key: 'Primary Image URL', desc: 'Main image URL' },
  { key: 'Additional Images', desc: 'Comma-separated URLs' },
  { key: 'Price (USD)', desc: 'USD price' },
  { key: 'Min Order Qty', desc: 'Minimum 1' },
  { key: 'Package Qty', desc: 'Items per package' },
  { key: 'Package Unit', desc: 'Each/Pair/Box/etc' },
  { key: 'Lead Time', desc: '2-3 weeks / etc' },
  { key: 'Availability', desc: 'In Stock / Made to Order' },
  { key: 'Status', desc: 'Draft / Active' },
  { key: 'Purchase Mode', desc: 'Buy Online + RFQ / RFQ Only' },
  { key: 'Spec 1 Name', desc: 'Attribute name' },
  { key: 'Spec 1 Value', desc: 'Attribute value' },
  { key: 'Spec 2 Name', desc: 'Attribute name' },
  { key: 'Spec 2 Value', desc: 'Attribute value' },
  { key: 'Spec 3 Name', desc: 'Attribute name' },
  { key: 'Spec 3 Value', desc: 'Attribute value' },
  { key: 'Spec 4 Name', desc: 'Attribute name' },
  { key: 'Spec 4 Value', desc: 'Attribute value' },
  { key: 'Spec 5 Name', desc: 'Attribute name' },
  { key: 'Spec 5 Value', desc: 'Attribute value' },
  { key: 'Spec 6 Name', desc: 'Attribute name' },
  { key: 'Spec 6 Value', desc: 'Attribute value' },
  { key: 'Spec 7 Name', desc: 'Attribute name' },
  { key: 'Spec 7 Value', desc: 'Attribute value' },
  { key: 'Spec 8 Name', desc: 'Attribute name' },
  { key: 'Spec 8 Value', desc: 'Attribute value' },
  { key: 'Spec 9 Name', desc: 'Attribute name' },
  { key: 'Spec 9 Value', desc: 'Attribute value' },
  { key: 'Meta Title', desc: 'Max 70 chars + | Machrio' },
  { key: 'Meta Description', desc: 'Max 160 chars' },
]

// Sample product data
const SAMPLE_PRODUCT = {
  'SKU': 'MACH-HP4853',
  'Name': 'Cut Resistant Gloves, ANSI A4 / EN 388:2016, Size 9, Nitrile Coated, HPPE/Glass Fiber, Pkg Qty 12',
  'L1 Category': 'Safety',
  'L2 Category': 'Hand & Arm Protection',
  'L3 Category': 'Safety Gloves',
  'Short Description': 'Cut-resistant safety gloves with ANSI A4 rating and nitrile palm coating for secure grip in wet or oily conditions. Constructed with HPPE fiber and seamless knit design for comfort during extended wear.',
  'Full Description': '<p>These Cut Resistant Gloves provide ANSI Cut Level A4 protection...</p><h3>Key Features</h3><ul><li>ANSI A4 rated</li><li>Nitrile palm coating</li></ul>',
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
  'Spec 5 Name': 'Glove Size',
  'Spec 5 Value': '9',
  'Spec 6 Name': 'Glove Material',
  'Spec 6 Value': 'HPPE and Glass Fiber Blend',
  'Spec 7 Name': 'Cut Resistance Level',
  'Spec 7 Value': 'A4 (ANSI)',
  'Spec 8 Name': 'Coating',
  'Spec 8 Value': 'Nitrile',
  'Spec 9 Name': '',
  'Spec 9 Value': '',
  'Meta Title': 'Cut Resistant Gloves, ANSI A4 / EN 388:2016, Size 9 | Machrio',
  'Meta Description': 'Buy Safety Gloves at competitive prices. ANSI A4 rated. Free quotes available. Shop industrial safety supplies at Machrio.com',
}

function generateTemplate() {
  // Build header row
  const headerRow = {}
  HEADERS.forEach(h => { headerRow[h.key] = h.key })
  
  // Build description row
  const descRow = {}
  HEADERS.forEach(h => { descRow[h.key] = h.desc })
  
  // Build data array
  const data = [descRow, SAMPLE_PRODUCT]
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data, { header: HEADERS.map(h => h.key) })
  
  // Set column widths
  const colWidths = HEADERS.map(h => {
    if (h.key.includes('Description')) return { wch: 50 }
    if (h.key === 'Name') return { wch: 60 }
    if (h.key.includes('URL') || h.key.includes('Images')) return { wch: 40 }
    if (h.key.includes('Meta')) return { wch: 40 }
    return { wch: 18 }
  })
  ws['!cols'] = colWidths
  
  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  
  // Write file
  const outputPath = path.join(__dirname, '../Machrio_Import_Template.xlsx')
  XLSX.writeFile(wb, outputPath)
  
  console.log('Template generated:', outputPath)
  console.log(`Columns: ${HEADERS.length}`)
  console.log('Row 1: Column headers')
  console.log('Row 2: Field descriptions (delete before import)')
  console.log('Row 3: Sample product (modify or delete)')
}

generateTemplate()
