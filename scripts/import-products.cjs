// Product Import Script for MROworks
// Reads Excel file and imports to Payload CMS
const XLSX = require('xlsx');
const path = require('path');

// Configuration
const XLSX_PATH = path.resolve(__dirname, '../../产品信息2602251142.xlsx');
const CNY_TO_USD_RATE = 0.14; // Approximate exchange rate

// Category mapping from mroport categories to MROworks 9 categories
const CATEGORY_MAPPING = {
  // Safety related
  'safety': 'safety',
  'eye & face protection': 'safety',
  'welding helmets': 'safety',
  'face shields': 'safety',
  'head protection': 'safety',
  'hard hats': 'safety',
  'hearing protection': 'safety',
  'earplugs': 'safety',
  'earmuffs': 'safety',
  'hand protection': 'safety',
  'gloves': 'safety',
  'work gloves': 'safety',
  'safety gloves': 'safety',
  'protective clothing': 'safety',
  'respirators': 'safety',
  'fall protection': 'safety',
  
  // Material handling
  'material handling': 'material-handling',
  'carts': 'material-handling',
  'hand trucks': 'material-handling',
  'dollies': 'material-handling',
  'pallet jacks': 'material-handling',
  'lifting': 'material-handling',
  'hoists': 'material-handling',
  'slings': 'material-handling',
  
  // Adhesives & Sealants
  'adhesives': 'adhesives-sealants-tape',
  'sealants': 'adhesives-sealants-tape',
  'tape': 'adhesives-sealants-tape',
  'tapes': 'adhesives-sealants-tape',
  'glue': 'adhesives-sealants-tape',
  
  // Packaging
  'packaging': 'packaging-shipping',
  'shipping': 'packaging-shipping',
  'boxes': 'packaging-shipping',
  'labels': 'packaging-shipping',
  
  // Cleaning
  'cleaning': 'cleaning-janitorial',
  'janitorial': 'cleaning-janitorial',
  'floor care': 'cleaning-janitorial',
  
  // Lighting
  'lighting': 'lighting',
  'lights': 'lighting',
  'bulbs': 'lighting',
  
  // Power Transmission
  'power transmission': 'power-transmission',
  'bearings': 'power-transmission',
  'belts': 'power-transmission',
  'chains': 'power-transmission',
  'gears': 'power-transmission',
  
  // Tool Storage
  'tool storage': 'tool-storage-workbenches',
  'workbenches': 'tool-storage-workbenches',
  'cabinets': 'tool-storage-workbenches',
  
  // Plumbing
  'plumbing': 'plumbing-pumps',
  'pumps': 'plumbing-pumps',
  'valves': 'plumbing-pumps',
  'pipes': 'plumbing-pumps',
  'fittings': 'plumbing-pumps',
  'gaskets': 'plumbing-pumps',
};

// Map category string to MROworks category slug
function mapCategory(categoryStr) {
  if (!categoryStr) return 'safety'; // Default
  
  const parts = categoryStr.toLowerCase().split(',').map(s => s.trim());
  
  for (const part of parts) {
    if (CATEGORY_MAPPING[part]) {
      return CATEGORY_MAPPING[part];
    }
  }
  
  // Check if any part contains keywords
  for (const part of parts) {
    for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
      if (part.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'safety'; // Default fallback
}

// Generate slug from name
function generateSlug(name, id) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  return `${slug}-${id.toLowerCase()}`;
}

// Clean HTML to plain text for short description
function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert CNY to USD
function convertPrice(cnyPrice) {
  const price = parseFloat(cnyPrice);
  if (isNaN(price)) return null;
  return Math.round(price * CNY_TO_USD_RATE * 100) / 100;
}

// Read and process Excel file
function readExcelData() {
  console.log('Reading Excel file:', XLSX_PATH);
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Read main product sheet
  const productsSheet = workbook.Sheets['商品(英文)'];
  const products = XLSX.utils.sheet_to_json(productsSheet);
  
  // Read images sheet
  const imagesSheet = workbook.Sheets['图片'];
  const images = XLSX.utils.sheet_to_json(imagesSheet);
  
  // Read SKU/model sheet
  const skuSheet = workbook.Sheets['型号'];
  const skus = XLSX.utils.sheet_to_json(skuSheet);
  
  // Read attributes sheet
  const attrSheet = workbook.Sheets['类目属性'];
  const attributes = XLSX.utils.sheet_to_json(attrSheet);
  
  // Create lookup maps
  const imageMap = {};
  images.forEach(img => {
    const id = img['商品id'];
    if (!imageMap[id]) imageMap[id] = [];
    if (img['轮播图']) imageMap[id].push(img['轮播图']);
  });
  
  const skuMap = {};
  skus.forEach(s => {
    skuMap[s['商品id']] = s;
  });
  
  const attrMap = {};
  attributes.forEach(a => {
    attrMap[a['商品id']] = a;
  });
  
  return { products, imageMap, skuMap, attrMap };
}

// Transform product data to Payload format
function transformProduct(product, imageMap, skuMap, attrMap) {
  const id = product['商品id'];
  const name = product['商品名称'];
  const categoryStr = product['分类(上下级逗号分隔,最多四级/用斜杠分隔多种分类)'];
  
  // Get additional data
  const images = imageMap[id] || [];
  const skuData = skuMap[id] || {};
  const attrs = attrMap[id] || {};
  
  // Extract short description from HTML
  const shortDesc = htmlToPlainText(product['简介']);
  
  // Convert prices - respect currency unit columns
  const supplyPrice = convertPrice(product['供货价']); // Always CNY
  const retailPriceUnit = (product['建议销售价单位'] || 'CNY').toUpperCase();
  const rawRetailPrice = parseFloat(product['建议销售价']);
  // If retail price is already USD, use as-is; if CNY, convert
  const retailPrice = isNaN(rawRetailPrice) ? null :
    retailPriceUnit === 'USD' ? Math.round(rawRetailPrice * 100) / 100 :
    Math.round(rawRetailPrice * CNY_TO_USD_RATE * 100) / 100;
  
  // Build specifications from attributes
  const specifications = [];
  const skipKeys = ['商品id', '分类(上下级逗号分隔,最多四级/用斜杠分隔多种分类)'];
  for (const [key, value] of Object.entries(attrs)) {
    if (!skipKeys.includes(key) && value && value !== '--') {
      specifications.push({ label: key, value: String(value) });
    }
  }
  
  // Determine category
  const categorySlug = mapCategory(categoryStr);
  
  // Build the product object for Payload
  return {
    name: name,
    slug: generateSlug(name, id),
    sku: skuData['型号'] || skuData['货号'] || id,
    status: product['上架'] === '是' ? 'published' : 'draft',
    categorySlug: categorySlug, // Will be resolved to ID later
    brand: product['品牌'] !== '--' ? product['品牌'] : null,
    shortDescription: shortDesc.substring(0, 500),
    fullDescription: product['详情'] || '',
    primaryImage: product['封面图'] || null,
    additionalImages: images,
    purchaseMode: 'both',
    pricing: {
      basePrice: retailPrice,
      costPrice: supplyPrice,
      priceUnit: 'each',
      currency: 'USD',
      tieredPricing: retailPrice ? [
        { minQty: 1, maxQty: 9, unitPrice: retailPrice },
        { minQty: 10, maxQty: 49, unitPrice: Math.round(retailPrice * 0.95 * 100) / 100 },
        { minQty: 50, unitPrice: Math.round(retailPrice * 0.90 * 100) / 100 },
      ] : [],
    },
    availability: 'in-stock',
    minOrderQuantity: 1,
    specifications: specifications.slice(0, 20), // Limit to 20 specs
    originalId: id, // Keep reference to original ID
    weight: product['重量'] ? parseFloat(product['重量']) : null,
    weightUnit: product['重量单位'] || 'KG',
  };
}

// Main function
async function main() {
  console.log('=== MROworks Product Import ===\n');
  
  // Read Excel data
  const { products, imageMap, skuMap, attrMap } = readExcelData();
  console.log(`Found ${products.length} products in Excel\n`);
  
  // Transform all products
  const transformedProducts = products
    .filter(p => p['上架'] === '是') // Only import published products
    .map(p => transformProduct(p, imageMap, skuMap, attrMap));
  
  console.log(`Transformed ${transformedProducts.length} active products\n`);
  
  // Group by category for summary
  const byCategory = {};
  transformedProducts.forEach(p => {
    byCategory[p.categorySlug] = (byCategory[p.categorySlug] || 0) + 1;
  });
  
  console.log('Products by category:');
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  
  // Output JSON file for import
  const outputPath = path.join(__dirname, 'import-data.json');
  const fs = require('fs');
  fs.writeFileSync(outputPath, JSON.stringify(transformedProducts, null, 2));
  console.log(`\nExported to: ${outputPath}`);
  
  // Show sample
  console.log('\n=== Sample Product ===');
  console.log(JSON.stringify(transformedProducts[0], null, 2));
  
  return transformedProducts;
}

main().catch(console.error);
