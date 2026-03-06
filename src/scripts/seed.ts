// Seed script for Machrio database
// Run with: npx tsx src/scripts/seed.ts

import { getPayload } from 'payload'
import config from '../payload/payload.config'

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
            mode: 'normal',
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

async function seed() {
  console.log('Starting seed...')

  const payload = await getPayload({ config })

  // Clean existing data
  console.log('Cleaning existing data...')
  await payload.delete({ collection: 'products', where: {} })
  await payload.delete({ collection: 'categories', where: {} })
  await payload.delete({ collection: 'brands', where: {} })

  // ─── Brands ───
  console.log('Creating brands...')
  const brands = await Promise.all([
    payload.create({ collection: 'brands', data: { name: '3M', slug: '3m', description: richText('3M is a global science company delivering innovative products for industrial safety, healthcare, and consumer markets. Known for quality PPE, adhesives, and tapes.'), website: 'https://www.3m.com', featured: true } }),
    payload.create({ collection: 'brands', data: { name: 'Honeywell', slug: 'honeywell', description: richText('Honeywell is a Fortune 100 technology company providing safety products, industrial automation, and building technologies for commercial and industrial applications.'), website: 'https://www.honeywell.com', featured: true } }),
    payload.create({ collection: 'brands', data: { name: 'Ansell', slug: 'ansell', description: richText('Ansell is a global leader in protection solutions, providing industrial and medical gloves, protective clothing, and safety solutions for various industries.'), website: 'https://www.ansell.com', featured: true } }),
    payload.create({ collection: 'brands', data: { name: 'Milwaukee Tool', slug: 'milwaukee-tool', description: richText('Milwaukee Tool manufactures heavy-duty power tools, hand tools, and accessories for professional contractors in construction, plumbing, and electrical trades.'), website: 'https://www.milwaukeetool.com', featured: true } }),
    payload.create({ collection: 'brands', data: { name: 'DeWalt', slug: 'dewalt', description: richText('DeWalt is a leading manufacturer of power tools, hand tools, and accessories for construction, manufacturing, and woodworking professionals.'), website: 'https://www.dewalt.com', featured: true } }),
    payload.create({ collection: 'brands', data: { name: 'MSA Safety', slug: 'msa-safety', description: richText('MSA Safety develops safety products that protect people and facility infrastructures including hard hats, fall protection, and gas detection equipment.'), website: 'https://www.msasafety.com', featured: true } }),
    payload.create({ collection: 'brands', data: { name: 'Loctite', slug: 'loctite', description: richText('Loctite is a leading brand of adhesives, sealants, and surface treatments for industrial manufacturing, maintenance, and repair applications worldwide.'), website: 'https://www.loctite.com', featured: true } }),
    payload.create({ collection: 'brands', data: { name: 'Rubbermaid Commercial', slug: 'rubbermaid-commercial', description: richText('Rubbermaid Commercial Products provides innovative cleaning, waste, material handling, and food service solutions for commercial and industrial environments.'), website: 'https://www.rubbermaidcommercial.com', featured: false } }),
    payload.create({ collection: 'brands', data: { name: 'Lithonia Lighting', slug: 'lithonia-lighting', description: richText('Lithonia Lighting is a leading provider of commercial and industrial lighting fixtures, offering energy-efficient LED solutions for warehouses, factories, and offices.'), website: 'https://www.lithonia.com', featured: false } }),
    payload.create({ collection: 'brands', data: { name: 'Grundfos', slug: 'grundfos', description: richText('Grundfos is the world leader in advanced pump solutions, providing reliable and efficient pumps for water supply, wastewater, and industrial process applications.'), website: 'https://www.grundfos.com', featured: false } }),
  ])

  const brandMap: Record<string, string> = {}
  for (const brand of brands) {
    brandMap[brand.slug] = brand.id
  }

  // ─── 9 Official Categories ───
  console.log('Creating categories...')
  const categories = await Promise.all([
    payload.create({ collection: 'categories', data: {
      name: 'Adhesives & Sealants & Tape', slug: 'adhesives-sealants-tape',
      description: richText('Industrial adhesives, sealants, and tapes for bonding, sealing, insulating, and waterproofing in manufacturing, construction, and maintenance applications.'),
      shortDescription: 'Bonding, sealing, and taping solutions for industrial use',
      featured: true, displayOrder: 1,
      facetGroups: [{ facetName: 'material', expanded: true }, { facetName: 'brand', expanded: false }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Material Handling', slug: 'material-handling',
      description: richText('Material handling equipment including hand trucks, platform carts, pallet jacks, shelving, lifting equipment, and storage solutions for warehouse and industrial facilities.'),
      shortDescription: 'Carts, trucks, lifts, and storage for warehouse operations',
      featured: true, displayOrder: 2,
      facetGroups: [{ facetName: 'brand', expanded: true }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Safety', slug: 'safety',
      description: richText('Personal Protective Equipment (PPE) and safety supplies including gloves, eyewear, hearing protection, hard hats, high-visibility apparel, respiratory protection, and fall arrest systems.'),
      shortDescription: 'PPE and safety supplies for industrial workplaces',
      featured: true, displayOrder: 3,
      facetGroups: [{ facetName: 'material', expanded: true }, { facetName: 'size', expanded: true }, { facetName: 'certification', expanded: false }, { facetName: 'brand', expanded: false }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Packaging & Shipping', slug: 'packaging-shipping',
      description: richText('Packaging materials and shipping supplies including boxes, bubble wrap, stretch film, packing tape, labels, void fill, and protective packaging for safe product transit.'),
      shortDescription: 'Boxes, wrap, tape, and protective packaging supplies',
      featured: true, displayOrder: 4,
      facetGroups: [{ facetName: 'material', expanded: true }, { facetName: 'size', expanded: true }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Cleaning and Janitorial', slug: 'cleaning-janitorial',
      description: richText('Commercial and industrial cleaning supplies, janitorial equipment, degreasers, disinfectants, mops, brooms, trash bags, paper products, and facility maintenance products.'),
      shortDescription: 'Industrial cleaning and facility maintenance supplies',
      featured: true, displayOrder: 5,
      facetGroups: [{ facetName: 'brand', expanded: true }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Lighting', slug: 'lighting',
      description: richText('Industrial and commercial lighting solutions including LED high-bay fixtures, work lights, emergency lighting, outdoor flood lights, and task lighting for warehouses and factories.'),
      shortDescription: 'LED, high-bay, work, and emergency lighting',
      featured: true, displayOrder: 6,
      facetGroups: [{ facetName: 'brand', expanded: true }, { facetName: 'certification', expanded: false }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Power Transmission', slug: 'power-transmission',
      description: richText('Power transmission components including bearings, belts, chains, couplings, gears, pulleys, sprockets, and related hardware for industrial machinery and equipment.'),
      shortDescription: 'Bearings, belts, chains, gears, and couplings',
      featured: true, displayOrder: 7,
      facetGroups: [{ facetName: 'size', expanded: true }, { facetName: 'material', expanded: false }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Tool Storage & Workbenches', slug: 'tool-storage-workbenches',
      description: richText('Tool storage solutions and workbenches including rolling cabinets, stationary chests, wall-mounted organizers, heavy-duty workbenches, and modular storage systems.'),
      shortDescription: 'Cabinets, workbenches, and tool organization',
      featured: true, displayOrder: 8,
      facetGroups: [{ facetName: 'brand', expanded: true }],
    }}),
    payload.create({ collection: 'categories', data: {
      name: 'Plumbing & Pumps', slug: 'plumbing-pumps',
      description: richText('Plumbing supplies and pump equipment including pipes, fittings, valves, water pumps, sump pumps, chemical pumps, hoses, clamps, and pipe thread sealant.'),
      shortDescription: 'Pipes, fittings, valves, and pump equipment',
      featured: true, displayOrder: 9,
      facetGroups: [{ facetName: 'material', expanded: true }, { facetName: 'size', expanded: true }],
    }}),
  ])

  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    categoryMap[cat.slug] = cat.id
  }

  // ─── Products (2+ per category) ───
  console.log('Creating products...')
  await Promise.all([
    // ── Adhesives & Sealants & Tape ──
    payload.create({ collection: 'products', data: {
      name: 'Super Glue, Industrial Grade, 20g',
      slug: 'super-glue-industrial-20g', sku: 'MRO-AD-001', status: 'published',
      primaryCategory: categoryMap['adhesives-sealants-tape'], brand: brandMap['loctite'],
      shortDescription: 'Industrial-grade cyanoacrylate super glue for rapid bonding of metal, plastic, rubber, and ceramics. Sets in seconds, bonds in minutes. 20g tube.',
      fullDescription: richText('This industrial-grade cyanoacrylate adhesive provides instant bonding for a wide range of substrates including metals, plastics, rubber, and ceramics. The precision nozzle allows controlled application in tight spaces. Resistant to moisture and moderate temperatures. Ideal for assembly, repair, and maintenance applications.'),
      purchaseMode: 'both',
      pricing: { basePrice: 8.49, priceUnit: 'per tube', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 11, unitPrice: 8.49 }, { minQty: 12, maxQty: 47, unitPrice: 7.49 }, { minQty: 48, unitPrice: 5.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'tube', leadTime: 'Ships same day',
      industries: ['manufacturing', 'automotive'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'Silicone Sealant, Clear, 10.1 oz Cartridge',
      slug: 'silicone-sealant-clear-10oz', sku: 'MRO-AD-002', status: 'published',
      primaryCategory: categoryMap['adhesives-sealants-tape'], brand: brandMap['3m'],
      shortDescription: 'All-purpose clear silicone sealant for waterproofing and sealing joints. Flexible, mold-resistant, rated for -60F to 400F. Standard caulk cartridge.',
      fullDescription: richText('This all-purpose silicone sealant provides a durable, flexible, waterproof seal for indoor and outdoor applications. Resists shrinking, cracking, and UV degradation. Excellent adhesion to glass, metal, wood, ceramic, and most plastics. Mold and mildew resistant for wet areas.'),
      purchaseMode: 'both',
      pricing: { basePrice: 6.99, priceUnit: 'per cartridge', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 11, unitPrice: 6.99 }, { minQty: 12, maxQty: 23, unitPrice: 5.99 }, { minQty: 24, unitPrice: 4.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 12, packageUnit: 'case', leadTime: 'Ships same day',
      industries: ['construction', 'manufacturing'],
    }}),

    // ── Material Handling ──
    payload.create({ collection: 'products', data: {
      name: 'Steel Platform Cart, 1000 lb Capacity',
      slug: 'steel-platform-cart-1000lb', sku: 'MRO-MH-001', status: 'published',
      primaryCategory: categoryMap['material-handling'], brand: brandMap['rubbermaid-commercial'],
      shortDescription: 'Heavy-duty steel platform cart with 1,000 lb capacity. 24" x 48" deck, 5" polyurethane casters, ergonomic push handle.',
      fullDescription: richText('This heavy-duty platform cart is built for demanding warehouse and factory environments. The all-steel construction supports up to 1,000 lbs. Non-marking polyurethane casters provide smooth, quiet rolling on concrete and tile. Ergonomic handle reduces strain during long shifts.'),
      purchaseMode: 'both',
      pricing: { basePrice: 289.99, priceUnit: 'each', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 4, unitPrice: 289.99 }, { minQty: 5, unitPrice: 264.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'each', leadTime: 'Ships in 2-3 days',
      industries: ['warehouse', 'manufacturing'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'Pallet Jack, 5500 lb Capacity',
      slug: 'pallet-jack-5500lb', sku: 'MRO-MH-002', status: 'published',
      primaryCategory: categoryMap['material-handling'], brand: brandMap['rubbermaid-commercial'],
      shortDescription: 'Manual hydraulic pallet jack rated for 5,500 lbs. Standard fork width 27", length 48". Nylon steer and load wheels.',
      fullDescription: richText('This heavy-duty manual pallet jack is designed for efficient pallet movement in warehouse and dock environments. The hydraulic pump delivers smooth lifting and lowering. Overload protection valve prevents damage. Ergonomic handle with 3-position control: raise, lower, neutral.'),
      purchaseMode: 'both',
      pricing: { basePrice: 349.99, priceUnit: 'each', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 2, unitPrice: 349.99 }, { minQty: 3, unitPrice: 319.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'each', leadTime: 'Ships in 3-5 days',
      industries: ['warehouse', 'manufacturing'],
    }}),

    // ── Safety ──
    payload.create({ collection: 'products', data: {
      name: 'Nitrile Exam Gloves, Powder-Free, Blue',
      slug: 'nitrile-exam-gloves-powder-free-blue', sku: 'MRO-SF-001', status: 'published',
      primaryCategory: categoryMap['safety'], brand: brandMap['ansell'],
      shortDescription: 'Premium powder-free nitrile exam gloves offering excellent chemical resistance and tactile sensitivity. Ideal for industrial, laboratory, and medical applications. Box of 100.',
      fullDescription: richText('These premium nitrile exam gloves provide superior protection for industrial and medical applications. Powder-free design reduces contamination risk. Textured fingertips ensure excellent grip. Outstanding resistance to chemicals, oils, and punctures.'),
      purchaseMode: 'both',
      pricing: { basePrice: 12.99, priceUnit: 'per box of 100', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 9, unitPrice: 12.99 }, { minQty: 10, maxQty: 49, unitPrice: 11.49 }, { minQty: 50, unitPrice: 9.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 100, packageUnit: 'box', leadTime: 'Ships same day',
      industries: ['healthcare', 'manufacturing', 'food-beverage'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'Cut-Resistant Gloves, ANSI A4',
      slug: 'cut-resistant-gloves-ansi-a4', sku: 'MRO-SF-002', status: 'published',
      primaryCategory: categoryMap['safety'], brand: brandMap['ansell'],
      shortDescription: 'ANSI A4 cut-resistant gloves with nitrile palm coating. Excellent grip in dry and oily conditions. Ideal for metalworking, glass handling, and construction.',
      fullDescription: richText('These ANSI A4 rated cut-resistant gloves provide superior protection for workers handling sharp materials, glass, and metal. Nitrile palm coating for excellent grip. Breathable knit back for all-day comfort.'),
      purchaseMode: 'both',
      pricing: { basePrice: 18.49, priceUnit: 'per pair', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 11, unitPrice: 18.49 }, { minQty: 12, maxQty: 47, unitPrice: 16.99 }, { minQty: 48, unitPrice: 14.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 12, packageUnit: 'dozen', leadTime: 'Ships same day',
      industries: ['manufacturing', 'construction', 'automotive'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'Safety Glasses, Anti-Fog Clear Lens',
      slug: 'safety-glasses-anti-fog-clear', sku: 'MRO-SF-003', status: 'published',
      primaryCategory: categoryMap['safety'], brand: brandMap['3m'],
      shortDescription: 'Lightweight safety glasses with anti-fog clear lenses and adjustable temples. ANSI Z87.1+ rated for high-impact protection.',
      fullDescription: richText('Professional-grade safety glasses with anti-fog lenses that stay clear in humid conditions. Lightweight polycarbonate construction. Meets ANSI Z87.1+ high-impact standards. UV protection.'),
      purchaseMode: 'both',
      pricing: { basePrice: 8.99, priceUnit: 'per pair', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 11, unitPrice: 8.99 }, { minQty: 12, maxQty: 47, unitPrice: 7.99 }, { minQty: 48, unitPrice: 6.49 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 12, packageUnit: 'box', leadTime: 'Ships same day',
      industries: ['manufacturing', 'construction', 'warehouse'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'Hard Hat, ANSI Type I Class E',
      slug: 'hard-hat-ansi-type-i-class-e', sku: 'MRO-SF-004', status: 'published',
      primaryCategory: categoryMap['safety'], brand: brandMap['msa-safety'],
      shortDescription: 'ANSI Type I Class E rated hard hat with 4-point ratchet suspension. Electrical protection up to 20,000 volts. Accessory slots.',
      fullDescription: richText('This hard hat provides essential head protection for construction, manufacturing, and utility workers. 4-point ratchet suspension for comfortable all-day wear. Class E rated for electrical hazards up to 20,000 volts.'),
      purchaseMode: 'both',
      pricing: { basePrice: 29.99, priceUnit: 'each', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 11, unitPrice: 29.99 }, { minQty: 12, maxQty: 47, unitPrice: 26.99 }, { minQty: 48, unitPrice: 23.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'each', leadTime: 'Ships same day',
      industries: ['construction', 'manufacturing', 'oil-gas', 'mining'],
    }}),

    // ── Packaging & Shipping ──
    payload.create({ collection: 'products', data: {
      name: 'Corrugated Shipping Boxes, 12x12x12" (25 pack)',
      slug: 'corrugated-shipping-boxes-12x12x12', sku: 'MRO-PK-001', status: 'published',
      primaryCategory: categoryMap['packaging-shipping'], brand: brandMap['3m'],
      shortDescription: 'Standard 32 ECT single-wall corrugated boxes, 12"x12"x12". Kraft brown. Flat-packed bundle of 25.',
      fullDescription: richText('These standard corrugated shipping boxes are ideal for general-purpose packing and shipping. 32 ECT single-wall construction supports up to 65 lbs. Easy to assemble flat-packed design saves storage space. Recyclable kraft material.'),
      purchaseMode: 'both',
      pricing: { basePrice: 29.99, priceUnit: 'per bundle of 25', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 3, unitPrice: 29.99 }, { minQty: 4, maxQty: 9, unitPrice: 26.99 }, { minQty: 10, unitPrice: 22.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 25, packageUnit: 'bundle', leadTime: 'Ships same day',
      industries: ['warehouse', 'manufacturing'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'Packing Tape, Clear, 2" x 110 yd (36 rolls)',
      slug: 'packing-tape-clear-2in-110yd-36', sku: 'MRO-PK-002', status: 'published',
      primaryCategory: categoryMap['packaging-shipping'], brand: brandMap['3m'],
      shortDescription: 'Heavy-duty clear packing tape, 2" wide x 110 yards per roll. 2.0 mil thickness. Case of 36 rolls.',
      fullDescription: richText('This heavy-duty packing tape provides reliable sealing for cartons and packages. Strong acrylic adhesive bonds securely to corrugated surfaces. 2.0 mil thickness resists splitting and tearing. Clear finish allows labels to show through.'),
      purchaseMode: 'both',
      pricing: { basePrice: 79.99, priceUnit: 'per case of 36', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 2, unitPrice: 79.99 }, { minQty: 3, maxQty: 5, unitPrice: 74.99 }, { minQty: 6, unitPrice: 69.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 36, packageUnit: 'case', leadTime: 'Ships same day',
      industries: ['warehouse', 'manufacturing'],
    }}),

    // ── Cleaning and Janitorial ──
    payload.create({ collection: 'products', data: {
      name: 'Industrial Degreaser, Heavy-Duty, 1 Gallon',
      slug: 'industrial-degreaser-heavy-duty-1gal', sku: 'MRO-CL-001', status: 'published',
      primaryCategory: categoryMap['cleaning-janitorial'], brand: brandMap['rubbermaid-commercial'],
      shortDescription: 'Heavy-duty industrial degreaser concentrate for removing grease, oil, and grime from shop floors, equipment, and machinery. 1-gallon jug, dilutable.',
      fullDescription: richText('This heavy-duty degreaser is formulated for the toughest industrial cleaning jobs. Concentrated formula dilutes up to 20:1 for economical use. Effective on grease, oil, carbon, and heavy soil on concrete, metal, and equipment surfaces. Non-corrosive and biodegradable.'),
      purchaseMode: 'both',
      pricing: { basePrice: 24.99, priceUnit: 'per gallon', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 3, unitPrice: 24.99 }, { minQty: 4, maxQty: 11, unitPrice: 22.49 }, { minQty: 12, unitPrice: 19.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 4, packageUnit: 'case', leadTime: 'Ships same day',
      industries: ['manufacturing', 'automotive'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'Commercial Wet Mop Kit with Bucket & Wringer',
      slug: 'commercial-wet-mop-kit-bucket-wringer', sku: 'MRO-CL-002', status: 'published',
      primaryCategory: categoryMap['cleaning-janitorial'], brand: brandMap['rubbermaid-commercial'],
      shortDescription: 'Complete commercial mopping system: 35-qt side-press wringer bucket, heavy-duty mop handle, and cotton loop-end mop head.',
      fullDescription: richText('This professional mopping system includes everything needed for efficient floor cleaning. The 35-quart bucket features a built-in side-press wringer for hands-free wringing. Heavy-duty fiberglass handle with quick-change connection. Loop-end cotton mop head for superior absorption.'),
      purchaseMode: 'both',
      pricing: { basePrice: 89.99, priceUnit: 'per kit', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 4, unitPrice: 89.99 }, { minQty: 5, unitPrice: 79.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'kit', leadTime: 'Ships in 1-2 days',
      industries: ['warehouse', 'manufacturing', 'food-beverage'],
    }}),

    // ── Lighting ──
    payload.create({ collection: 'products', data: {
      name: 'LED High Bay Light, 200W, 5000K',
      slug: 'led-high-bay-light-200w-5000k', sku: 'MRO-LT-001', status: 'published',
      primaryCategory: categoryMap['lighting'], brand: brandMap['lithonia-lighting'],
      shortDescription: '200W LED high bay fixture, 26,000 lumens, 5000K daylight. Replaces 400W metal halide. IP65 rated, 0-10V dimmable. 5-year warranty.',
      fullDescription: richText('This high-performance LED high bay fixture delivers 26,000 lumens at 5000K for bright, uniform illumination in warehouses, factories, and gymnasiums. IP65 ingress protection for dusty and damp environments. 130 lumens per watt efficiency. Tool-free mounting with included chain/V-hook.'),
      purchaseMode: 'both',
      pricing: { basePrice: 149.99, priceUnit: 'each', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 5, unitPrice: 149.99 }, { minQty: 6, maxQty: 19, unitPrice: 134.99 }, { minQty: 20, unitPrice: 119.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'each', leadTime: 'Ships in 1-2 days',
      industries: ['warehouse', 'manufacturing'],
    }}),

    // ── Power Transmission ──
    payload.create({ collection: 'products', data: {
      name: 'Deep Groove Ball Bearing, 6205-2RS',
      slug: 'deep-groove-ball-bearing-6205-2rs', sku: 'MRO-PT-001', status: 'published',
      primaryCategory: categoryMap['power-transmission'], brand: brandMap['honeywell'],
      shortDescription: 'Sealed deep groove ball bearing, 6205-2RS. 25mm bore, 52mm OD, 15mm width. Double rubber seal. For electric motors, conveyors, and general machinery.',
      fullDescription: richText('This 6205-2RS deep groove ball bearing is one of the most versatile and widely used bearing types. Pre-lubricated with double rubber seals for maintenance-free operation. Suitable for radial and light axial loads. Common replacement for electric motors, pumps, conveyors, and HVAC equipment.'),
      purchaseMode: 'both',
      pricing: { basePrice: 6.99, priceUnit: 'each', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 9, unitPrice: 6.99 }, { minQty: 10, maxQty: 49, unitPrice: 5.49 }, { minQty: 50, unitPrice: 3.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 10, packageUnit: 'box', leadTime: 'Ships same day',
      industries: ['manufacturing'],
    }}),

    // ── Tool Storage & Workbenches ──
    payload.create({ collection: 'products', data: {
      name: 'Heavy-Duty Steel Workbench, 72" x 30"',
      slug: 'heavy-duty-steel-workbench-72x30', sku: 'MRO-TS-001', status: 'published',
      primaryCategory: categoryMap['tool-storage-workbenches'], brand: brandMap['milwaukee-tool'],
      shortDescription: '72" x 30" heavy-duty steel workbench with hardwood top. 3,000 lb capacity. Adjustable leveling feet. Powder-coated steel frame.',
      fullDescription: richText('This industrial workbench is built for the most demanding shop environments. The 1.75" thick solid hardwood top resists dents and scratches. The all-welded 12-gauge steel frame supports up to 3,000 lbs. Adjustable leveling feet compensate for uneven floors. Optional drawer pedestal and back panel available.'),
      purchaseMode: 'both',
      pricing: { basePrice: 459.99, priceUnit: 'each', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 2, unitPrice: 459.99 }, { minQty: 3, unitPrice: 429.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'each', leadTime: 'Ships in 3-5 days',
      industries: ['manufacturing', 'automotive'],
    }}),

    // ── Plumbing & Pumps ──
    payload.create({ collection: 'products', data: {
      name: 'Submersible Sump Pump, 1/3 HP',
      slug: 'submersible-sump-pump-1-3hp', sku: 'MRO-PP-001', status: 'published',
      primaryCategory: categoryMap['plumbing-pumps'], brand: brandMap['grundfos'],
      shortDescription: '1/3 HP submersible sump pump with automatic float switch. 46 GPM max flow, 1-1/2" NPT discharge. Thermoplastic housing, stainless steel hardware.',
      fullDescription: richText('This 1/3 HP submersible sump pump provides reliable water removal for basements, crawl spaces, and light commercial drainage. Automatic float switch for hands-free operation. Thermoplastic construction resists corrosion. Screen intake prevents clogging.'),
      purchaseMode: 'both',
      pricing: { basePrice: 119.99, priceUnit: 'each', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 4, unitPrice: 119.99 }, { minQty: 5, unitPrice: 109.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 1, packageUnit: 'each', leadTime: 'Ships in 1-2 days',
      industries: ['construction', 'manufacturing'],
    }}),
    payload.create({ collection: 'products', data: {
      name: 'PTFE Thread Seal Tape, 1/2" x 520" (10 pack)',
      slug: 'ptfe-thread-seal-tape-10pk', sku: 'MRO-PP-002', status: 'published',
      primaryCategory: categoryMap['plumbing-pumps'], brand: brandMap['3m'],
      shortDescription: 'Standard density PTFE thread seal tape for plumbing connections. 1/2" wide x 520" per roll. Pack of 10 rolls.',
      fullDescription: richText('This standard density PTFE tape provides leak-proof seals on threaded pipe joints. Compatible with all pipe materials and most chemicals. Easy to apply and remove. Meets MIL-T-27730A specification.'),
      purchaseMode: 'both',
      pricing: { basePrice: 9.99, priceUnit: 'per 10-pack', currency: 'USD', tieredPricing: [{ minQty: 1, maxQty: 9, unitPrice: 9.99 }, { minQty: 10, maxQty: 24, unitPrice: 8.49 }, { minQty: 25, unitPrice: 6.99 }] },
      availability: 'in-stock', minOrderQuantity: 1, packageQty: 10, packageUnit: 'pack', leadTime: 'Ships same day',
      industries: ['construction', 'manufacturing'],
    }}),
  ])

  console.log('Seed completed successfully!')
  console.log(`Created: ${brands.length} brands, ${categories.length} categories, 19 products`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
