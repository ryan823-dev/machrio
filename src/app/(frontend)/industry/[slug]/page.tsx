import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { searchProducts } from '@/lib/db'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { StructuredData } from '@/components/shared/StructuredData'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { ProductGrid } from '@/components/category/ProductGrid'

// SSR: 直接查询 PostgreSQL
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Industry data — static content for 6 industries
// ---------------------------------------------------------------------------

interface IndustryInfo {
  name: string
  description: string
  intro: string
  // categories: { name: string; slug: string }[]  // 暂时移除，因为分类数据不存在
  scenarios: { title: string; description: string; icon: string; categories: string[] }[]
  compliance: { standards: string[]; description: string }
  faqs: { question: string; answer: string }[]
}

const industryData: Record<string, IndustryInfo> = {
  manufacturing: {
    name: 'Manufacturing',
    description: 'Industrial MRO supplies for manufacturing facilities — safety equipment, adhesives, power transmission parts, and maintenance products for production lines.',
    intro: 'Keep your manufacturing operations running smoothly with reliable MRO supplies. From safety equipment protecting workers on the production floor to adhesives and sealants maintaining equipment integrity, we provide the products manufacturing facilities depend on daily. Our catalog covers maintenance, repair, and operations needs across discrete and process manufacturing.',
    categories: [
      { name: 'Safety & PPE', slug: 'safety' },
      { name: 'Adhesives & Sealants', slug: 'adhesives-sealants-tape' },
      { name: 'Power Transmission', slug: 'power-transmission' },
      { name: 'Material Handling', slug: 'material-handling' },
    ],
    scenarios: [
      {
        title: 'Production Line Maintenance',
        description: 'Minimize unplanned downtime with the right MRO inventory. Bearings, belts, adhesives, and lubricants keep conveyors, motors, and assembly equipment running at peak efficiency.',
        icon: '🔧',
        categories: ['power-transmission', 'adhesives-sealants-tape'],
      },
      {
        title: 'Workplace Safety Compliance',
        description: 'Protect your workforce with ANSI/OSHA-compliant PPE. Safety glasses, cut-resistant gloves, hearing protection, and hi-vis apparel for every role on the factory floor.',
        icon: '🛡️',
        categories: ['safety'],
      },
      {
        title: 'Equipment Repair & Assembly',
        description: 'Industrial-grade adhesives, tapes, and sealants for bonding, insulating, and sealing. From structural epoxies to electrical tape, get the right product for permanent or temporary repairs.',
        icon: '🏭',
        categories: ['adhesives-sealants-tape'],
      },
      {
        title: 'Material Flow & Storage',
        description: 'Organize and move materials efficiently with shelving, carts, bins, and lifting equipment. Streamline warehouse-to-line delivery and reduce handling injuries.',
        icon: '📦',
        categories: ['material-handling'],
      },
    ],
    compliance: {
      standards: ['OSHA 29 CFR 1910', 'ANSI Z87.1', 'ANSI/ISEA 105', 'ISO 9001', 'NFPA 70E'],
      description: 'Manufacturing facilities must comply with OSHA general industry standards covering machine guarding, PPE, electrical safety, and hazard communication. Our products meet or exceed relevant ANSI and ISO standards.',
    },
    faqs: [
      { question: 'What MRO supplies should I stock to reduce unplanned production downtime?', answer: 'Focus on three categories: (1) Critical mechanical spares — bearings, belts, and seals matched to your specific equipment models, (2) Emergency repair consumables — fast-cure adhesives, thread sealants, and electrical tape, (3) Safety replenishment — gloves and eye protection that your team goes through fastest. Audit your last 12 months of breakdown incidents to identify the 20% of parts causing 80% of delays, and keep those at 2x your average consumption rate.' },
      { question: 'How do I choose the right cut-resistant gloves for my production line?', answer: 'Match the ANSI/ISEA 105 cut level to your application: A2 for general assembly and light material handling, A4 for sheet metal, stamping, and glass handling, A6-A9 for sharp edge work and blade changes. Also consider grip (sandy nitrile for oily parts, polyurethane for dry precision work), dexterity needs (thinner 18-gauge for fine assembly vs. 13-gauge for heavy duty), and touchscreen compatibility if operators use HMI panels.' },
      { question: 'What certifications should MRO products have for ISO 9001-certified manufacturing plants?', answer: 'ISO 9001 requires that purchased products meet defined specifications. For PPE, require ANSI certification marks (Z87.1 for eyes, ISEA 105 for gloves, Z89.1 for hard hats). For adhesives, request technical data sheets (TDS) showing tested performance per ASTM or MIL-SPEC standards. For electrical items, require UL or CSA listing. Keep certificates of conformance (CoC) on file — your QMS auditor will ask for them.' },
      { question: 'Can I get a sample before committing to a bulk order?', answer: 'Yes. For most products we can arrange evaluation samples so your team can test fit, durability, and compatibility before committing to volume. Submit an RFQ specifying "sample request" with the product names and quantities needed for evaluation. Samples are typically shipped within 3-5 business days.' },
      { question: 'What is the typical lead time for MRO bulk orders?', answer: 'In-stock items ship within 1-2 business days. For bulk orders (100+ units of a single SKU), allow 5-10 business days depending on quantity and warehouse location. Made-to-order or sourced items (specific brands, custom specifications) typically take 2-4 weeks. We provide confirmed lead times in every quote, and you can set up scheduled recurring deliveries to avoid stockouts.' },
    ],
  },

  construction: {
    name: 'Construction',
    description: 'Construction-grade MRO supplies — safety gear, adhesives, material handling equipment, and site essentials for contractors and builders.',
    intro: 'Build with confidence using industrial-grade supplies designed for the demands of construction sites. From fall protection and hard hats to heavy-duty adhesives and material handling equipment, our products meet the tough requirements of commercial and residential construction. We supply contractors, general builders, and specialty trades.',
    categories: [
      { name: 'Safety & PPE', slug: 'safety' },
      { name: 'Material Handling', slug: 'material-handling' },
      { name: 'Adhesives & Sealants', slug: 'adhesives-sealants-tape' },
      { name: 'Tool Storage', slug: 'tool-storage-workbenches' },
    ],
    scenarios: [
      {
        title: 'Job Site Safety',
        description: 'Hard hats, safety vests, fall protection harnesses, and steel-toe boot covers. OSHA-compliant PPE that protects workers across all construction trades.',
        icon: '👷',
        categories: ['safety'],
      },
      {
        title: 'Concrete & Masonry Work',
        description: 'Sealants, construction adhesives, and waterproofing tapes for joints, cracks, and structural bonding. Products rated for outdoor exposure and temperature extremes.',
        icon: '🧱',
        categories: ['adhesives-sealants-tape'],
      },
      {
        title: 'Tool Organization & Transport',
        description: 'Jobsite toolboxes, rolling carts, and workbenches that travel between sites. Keep tools organized, secure, and accessible across multiple projects.',
        icon: '🧰',
        categories: ['tool-storage-workbenches'],
      },
      {
        title: 'Heavy Material Movement',
        description: 'Dollies, hand trucks, hoists, and lifting straps for moving lumber, drywall, steel, and equipment safely across the job site.',
        icon: '🏗️',
        categories: ['material-handling'],
      },
    ],
    compliance: {
      standards: ['OSHA 29 CFR 1926', 'ANSI Z89.1', 'ANSI Z359.1', 'ANSI Z87.1', 'ASTM F2413'],
      description: 'Construction sites fall under OSHA 29 CFR 1926 construction standards, covering fall protection, head protection, scaffolding, and excavation safety. Our PPE meets applicable ANSI standards for hard hats, harnesses, and eye protection.',
    },
    faqs: [
      { question: 'What fall protection equipment does OSHA require at different heights?', answer: 'OSHA 29 CFR 1926.501 requires fall protection at 6 feet in construction (vs. 4 feet in general industry). You need either guardrails, safety net systems, or personal fall arrest systems (PFAS). A PFAS includes an ANSI Z359.1-rated full-body harness, shock-absorbing lanyard, and an anchor point rated for 5,000 lbs per worker. For leading edge work, self-retracting lifelines (SRLs) are strongly recommended.' },
      { question: 'Which construction adhesives withstand outdoor weather and temperature changes?', answer: 'For outdoor structural bonding, polyurethane adhesives (PU) offer the best all-around weather resistance — they cure in moisture and handle temperature cycling from -40F to 200F. Silicone sealants are best for expansion joints and waterproofing where flexibility is needed. For heavy masonry, use construction epoxies rated for sustained load. Always check the TDS for service temperature range and UV resistance.' },
      { question: 'How do I estimate MRO supply quantities for a construction project?', answer: 'Start with crew size and project duration. For consumable PPE: plan 1 pair of gloves per worker per 2-3 days, 1 hard hat per worker per 6 months, and 1 hi-vis vest per worker per 3 months. For adhesives and sealants: estimate by linear feet of joint or square footage of application. Submit a material list via our RFQ form — our team will help you right-size quantities and schedule phased deliveries to match your project timeline.' },
      { question: 'Can you deliver MRO supplies directly to a construction job site?', answer: 'Yes, we ship to any commercial address including active job sites. For large orders, we offer freight shipping with scheduled delivery windows. Provide your site foreman\'s contact number so the carrier can coordinate access. For multi-site projects, we can set up separate delivery addresses and split shipments on a single purchase order.' },
    ],
  },

  automotive: {
    name: 'Automotive',
    description: 'MRO supplies for automotive manufacturing and repair — safety equipment, adhesives, power transmission components, and shop essentials.',
    intro: 'Support your automotive operations with specialized MRO supplies. Whether you run an assembly line, body shop, or fleet maintenance garage, we supply the safety equipment, adhesives, power transmission parts, and tools that keep vehicles moving from production to repair.',
    categories: [
      { name: 'Safety & PPE', slug: 'safety' },
      { name: 'Adhesives & Sealants', slug: 'adhesives-sealants-tape' },
      { name: 'Power Transmission', slug: 'power-transmission' },
      { name: 'Tool Storage', slug: 'tool-storage-workbenches' },
    ],
    scenarios: [
      {
        title: 'Assembly Line Operations',
        description: 'Bearings, belts, and drive components for conveyor systems. Protective gloves and eyewear for workers handling parts, chemicals, and power tools at high production speeds.',
        icon: '🚗',
        categories: ['power-transmission', 'safety'],
      },
      {
        title: 'Body Shop & Paint Prep',
        description: 'Masking tapes, surface preparation adhesives, and chemical-resistant gloves for body work, priming, and painting operations.',
        icon: '🎨',
        categories: ['adhesives-sealants-tape', 'safety'],
      },
      {
        title: 'Fleet Maintenance',
        description: 'Thread sealants, gasket makers, and anti-seize compounds for routine maintenance. Organized tool storage keeps service bays efficient and reduces repair time.',
        icon: '🔩',
        categories: ['adhesives-sealants-tape', 'tool-storage-workbenches'],
      },
    ],
    compliance: {
      standards: ['OSHA 29 CFR 1910', 'ANSI Z87.1', 'ANSI/ISEA 105', 'IATF 16949', 'EPA 40 CFR'],
      description: 'Automotive facilities must meet OSHA general industry standards and often comply with IATF 16949 quality management for automotive production. PPE must protect against chemical splash, flying debris, and repetitive motion injuries.',
    },
    faqs: [
      { question: 'What adhesives are approved for automotive OEM assembly vs. aftermarket repair?', answer: 'OEM assembly typically requires adhesives tested to automaker specifications — structural epoxies (meeting OEM-equivalent bond strength), anaerobic thread lockers (Loctite-equivalent grades 242/271/680), and approved silicone gasket makers. Aftermarket repair shops have more flexibility but should still match the adhesive type to the substrate (metal-to-metal, plastic-to-plastic, or mixed). Always check the TDS for temperature range, chemical resistance, and cure time relative to your production cycle.' },
      { question: 'What respirator rating do auto body painters need for isocyanate exposure?', answer: 'Isocyanate-containing paints (polyurethane clearcoats, 2K primers) require a supplied-air respirator (SAR) or, at minimum, a NIOSH-approved full-face respirator with OV/P100 combination cartridges. Half-face respirators are NOT sufficient for isocyanates. Ensure your paint booth ventilation meets OSHA permissible exposure limits (PEL). Workers should also wear chemical splash goggles (if not using full-face) and nitrile gloves rated for solvent resistance.' },
      { question: 'How do I set up a recurring MRO order for a fleet maintenance shop?', answer: 'Submit an RFQ listing the products and estimated monthly quantities. Our team will set up a scheduled order with agreed pricing, and you will receive proactive reminders before each shipment. This works well for consumables like gloves, shop towels, thread sealant, and brake cleaner that your shop uses at predictable rates. Adjust quantities anytime via email or a follow-up quote request.' },
      { question: 'What power transmission parts are compatible with my conveyor system?', answer: 'To find compatible bearings, belts, or sprockets, you need three pieces of information: (1) the equipment manufacturer and model number, (2) the existing part number or dimensions (bore diameter, belt width/profile, chain pitch), (3) operating conditions (speed, load, environment). Share these details in an RFQ and our sourcing team can identify exact replacements or cross-reference equivalents from available brands.' },
    ],
  },

  healthcare: {
    name: 'Healthcare',
    description: 'MRO supplies for healthcare facilities — PPE, cleaning and sanitation products, packaging supplies, and facility maintenance essentials.',
    intro: 'Maintain safe and hygienic healthcare environments with our selection of MRO supplies. PPE that meets medical-grade standards, cleaning products for infection control, and packaging supplies for safe specimen and material transport. We serve hospitals, clinics, laboratories, and long-term care facilities.',
    categories: [
      { name: 'Safety & PPE', slug: 'safety' },
      { name: 'Cleaning and Janitorial', slug: 'cleaning-and-janitorial' },
      { name: 'Packaging & Shipping', slug: 'packaging-shipping' },
    ],
    scenarios: [
      {
        title: 'Infection Control',
        description: 'Exam gloves, face masks, gowns, and surface disinfectants. Products that help healthcare facilities maintain hygiene protocols and reduce healthcare-associated infections.',
        icon: '🏥',
        categories: ['safety', 'cleaning-and-janitorial'],
      },
      {
        title: 'Facility Housekeeping',
        description: 'Hospital-grade cleaners, floor care supplies, and waste handling products. Maintain clean, safe environments in patient rooms, operating theaters, and common areas.',
        icon: '🧹',
        categories: ['cleaning-and-janitorial'],
      },
      {
        title: 'Lab & Specimen Packaging',
        description: 'Biohazard bags, specimen transport containers, and tamper-evident packaging for safe handling and shipping of medical samples and supplies.',
        icon: '🔬',
        categories: ['packaging-shipping'],
      },
    ],
    compliance: {
      standards: ['OSHA BBP 29 CFR 1910.1030', 'CDC Guidelines', 'ANSI/AAMI PB70', 'EPA List N', 'FDA 21 CFR'],
      description: 'Healthcare facilities must comply with OSHA bloodborne pathogen standards, CDC infection control guidelines, and EPA-registered disinfectant requirements. PPE must meet ANSI/AAMI barrier protection levels appropriate to the task.',
    },
    faqs: [
      { question: 'What barrier level gown do I need for different healthcare procedures?', answer: 'ANSI/AAMI PB70 defines four barrier levels: Level 1 for basic care and standard medical unit tasks, Level 2 for blood draws, suturing, and pathology, Level 3 for arterial blood, ER trauma, and Level 4 for long surgical procedures with high fluid exposure. Most general hospital floors need Level 1-2 gowns stocked. Surgical suites and ER should stock Level 3-4. Always verify your facility infection control protocol for the required level by procedure type.' },
      { question: 'Which EPA-registered disinfectants are effective against healthcare-associated pathogens?', answer: 'Check EPA List N (emerging pathogens) and List K (C. difficile). For daily surface disinfection, quaternary ammonium compounds ("quats") provide broad-spectrum coverage with a 1-3 minute contact time. For C. diff and norovirus, you need bleach-based (sodium hypochlorite) or hydrogen peroxide products. Peroxyacetic acid (PAA) is used for endoscope and instrument disinfection. Always follow the manufacturer-specified contact time — wiping before the contact time elapses renders the disinfection ineffective.' },
      { question: 'How do I ensure PPE supply continuity for a hospital during demand surges?', answer: 'Set par levels (minimum stock thresholds) based on your average daily consumption plus a 30-day safety buffer. For critical items like exam gloves and masks, diversify suppliers — single-source dependency is the #1 risk in healthcare procurement. Our RFQ process supports scheduled recurring orders so replenishment is automatic. We can also set up surge-capacity agreements where pre-negotiated quantities are reserved at locked pricing.' },
      { question: 'What packaging is required for shipping clinical specimens?', answer: 'UN 3373 Biological Substance Category B shipments require a triple-packaging system: a leak-proof primary container, leak-proof secondary container with absorbent material, and a rigid outer package marked with UN 3373 diamond. For Category A (highly infectious), use UN 2814/2900 certified packaging. We stock compliant specimen transport bags, absorbent sheets, and outer boxes that meet IATA and DOT requirements.' },
    ],
  },

  'food-beverage': {
    name: 'Food & Beverage',
    description: 'Food-safe MRO supplies for food processing and beverage manufacturing — PPE, sanitation products, packaging, and material handling equipment.',
    intro: 'Meet food safety standards with MRO supplies designed for food and beverage operations. Food-grade gloves, sanitation chemicals, packaging materials, and stainless-steel material handling equipment that comply with FDA and USDA requirements. We serve food processors, beverage manufacturers, commercial kitchens, and cold storage facilities.',
    categories: [
      { name: 'Safety & PPE', slug: 'safety' },
      { name: 'Cleaning and Janitorial', slug: 'cleaning-and-janitorial' },
      { name: 'Packaging & Shipping', slug: 'packaging-shipping' },
      { name: 'Material Handling', slug: 'material-handling' },
    ],
    scenarios: [
      {
        title: 'Food Processing Lines',
        description: 'Food-grade nitrile gloves, hairnets, beard covers, and cut-resistant gloves for production workers. Metal-detectable options available for HACCP compliance.',
        icon: '🥫',
        categories: ['safety'],
      },
      {
        title: 'Sanitation & CIP',
        description: 'Food-safe sanitizers, degreasers, and cleaning chemicals for clean-in-place (CIP) systems, production surfaces, and processing equipment.',
        icon: '✨',
        categories: ['cleaning-and-janitorial'],
      },
      {
        title: 'Product Packaging',
        description: 'Food-grade packaging tapes, stretch wrap, labels, and shipping materials that maintain product integrity from production through distribution.',
        icon: '📋',
        categories: ['packaging-shipping'],
      },
      {
        title: 'Cold Storage & Warehousing',
        description: 'Insulated gloves, cold-rated carts, and material handling equipment designed for freezer and cold room environments down to -20°F.',
        icon: '❄️',
        categories: ['material-handling'],
      },
    ],
    compliance: {
      standards: ['FDA 21 CFR 110', 'USDA FSIS', 'HACCP', 'SQF', 'NSF International'],
      description: 'Food and beverage facilities must meet FDA Good Manufacturing Practices (GMP), HACCP food safety plans, and potentially SQF or BRC certification requirements. All products in contact with food must be FDA-compliant and NSF-rated where applicable.',
    },
    faqs: [
      { question: 'How do I select food-grade gloves that pass a HACCP audit?', answer: 'Choose FDA 21 CFR 177-compliant nitrile gloves in a detectable color (blue is industry standard). For HACCP compliance, gloves should be: (1) powder-free to prevent contamination, (2) available in a metal-detectable variant if your line has metal detection checkpoints, (3) AQL 1.5 or lower for pinhole defect rates. Keep your glove supplier certificates of compliance (CoC) readily accessible — auditors from SQF, BRC, or your customer QA team will request them.' },
      { question: 'What sanitizers are NSF-approved for food contact surfaces?', answer: 'Look for NSF Registration Mark with the specific category: NSF D2 (sanitizers requiring rinse), NSF D1 (no-rinse sanitizers for food contact surfaces). Common chemistries: quaternary ammonium (quats) at 200 ppm for general sanitizing, sodium hypochlorite (bleach) at 50-200 ppm, and peroxyacetic acid (PAA) at 200 ppm — PAA is preferred for organic-certified operations because it leaves no residue. Always verify the product is on the EPA-registered list and follow the label contact time exactly.' },
      { question: 'What PPE and equipment do I need for cold storage and blast freezer work?', answer: 'For freezer environments (-20F and below): insulated gloves rated for the actual temperature (check EN 511 cold rating, not just generic "winter" gloves), thermal base layers, insulated coveralls, and anti-fog safety goggles. Material handling equipment must be cold-rated — standard hydraulic pallet jacks can fail in freezer temperatures due to hydraulic fluid thickening. Specify freezer-rated carts and stainless steel shelving that will not corrode from temperature cycling condensation.' },
      { question: 'Can you supply packaging materials that meet food safety requirements for direct food contact?', answer: 'Yes. We carry FDA-compliant stretch wrap, food-grade packing tapes (no off-gassing adhesives), and BPA-free packaging materials. For direct food contact applications, request products with FDA 21 CFR 175-178 compliance letters. For export, you may also need EU Regulation 1935/2004 compliance — specify your target market in the RFQ and we will source accordingly.' },
    ],
  },

  warehouse: {
    name: 'Warehouse & Logistics',
    description: 'MRO supplies for warehouses and logistics operations — material handling equipment, safety gear, packaging supplies, and facility lighting.',
    intro: 'Optimize your warehouse and logistics operations with the right MRO supplies. Material handling equipment for efficient picking and shipping, safety gear for forklift operators and floor workers, packaging supplies for outbound orders, and high-bay lighting for visibility across large facilities.',
    categories: [
      { name: 'Material Handling', slug: 'material-handling' },
      { name: 'Safety & PPE', slug: 'safety' },
      { name: 'Packaging & Shipping', slug: 'packaging-shipping' },
      { name: 'Lighting', slug: 'lighting' },
    ],
    scenarios: [
      {
        title: 'Order Picking & Fulfillment',
        description: 'Pick carts, bins, label printers, and packing supplies that speed up order fulfillment. Organize pick zones with shelving and rack systems for faster throughput.',
        icon: '📦',
        categories: ['material-handling', 'packaging-shipping'],
      },
      {
        title: 'Dock & Loading Safety',
        description: 'Hi-vis vests, dock bumpers, wheel chocks, and safety signage. Protect workers in high-traffic loading dock areas where forklifts and trucks operate.',
        icon: '🚛',
        categories: ['safety'],
      },
      {
        title: 'Shipping & Outbound Logistics',
        description: 'Stretch wrap, strapping, void fill, and corrugated boxes. Complete packaging solutions for protecting products during transit and reducing damage claims.',
        icon: '✈️',
        categories: ['packaging-shipping'],
      },
      {
        title: 'Facility Lighting',
        description: 'High-bay LED lights, motion-sensor fixtures, and emergency exit lighting. Proper illumination reduces errors, prevents accidents, and improves pick accuracy.',
        icon: '💡',
        categories: ['lighting'],
      },
    ],
    compliance: {
      standards: ['OSHA 29 CFR 1910.176', 'ANSI/ITSDF B56.1', 'OSHA 1910.178', 'NFPA 101', 'ANSI Z535'],
      description: 'Warehouse operations must comply with OSHA standards for material handling and storage, powered industrial truck operation (forklifts), and walking-working surfaces. Lighting must meet OSHA minimum illumination requirements and emergency egress standards.',
    },
    faqs: [
      { question: 'What safety equipment is required in forklift traffic zones per OSHA?', answer: 'OSHA 1910.178 requires: (1) only trained/certified operators may drive forklifts, (2) pedestrian zones must be separated from forklift lanes with floor markings, barriers, or guardrails, (3) hi-vis vests are required for all floor workers in shared traffic areas, (4) audible warning devices (horns) at intersections and blind corners. Additionally, wheel chocks are required at loading docks when trucks are being loaded/unloaded. Blue dock safety lights (spotlights on forklift) improve visibility in narrow aisles.' },
      { question: 'How do I calculate packaging material needs for my shipping volume?', answer: 'Start with your average daily shipment count and box size distribution. Rule of thumb: (1) Stretch wrap: 1 roll covers approximately 100 standard pallet wraps, (2) Void fill: plan 1 cubic foot of fill per 2 cubic feet of empty box space, (3) Tape: 1 roll of 2-inch tape closes approximately 60 medium boxes. For your exact consumption, track usage for 2 weeks then extrapolate. Submit your daily volumes via RFQ and our team will recommend quantities and a replenishment schedule that avoids both stockouts and overstock.' },
      { question: 'What is the ROI of switching warehouse lighting from HID to LED high-bay?', answer: 'LED high-bay fixtures typically deliver 40-60% energy savings over HID, with payback in 12-24 months depending on your utility rate and operating hours. Beyond energy: LEDs reach full brightness instantly (no warm-up), last 50,000+ hours vs. 15,000 for HID (cutting maintenance labor), and provide better color rendering (CRI 80+) which improves pick accuracy and reduces errors. Adding motion sensors to low-traffic aisles extends savings by another 15-20%.' },
      { question: 'How do I choose the right pallet jack for my warehouse floor conditions?', answer: 'Key factors: (1) Weight capacity — standard manual jacks handle 5,000 lbs, heavy-duty up to 8,000 lbs, (2) Fork length — 48" is standard for GMA pallets, shorter forks for tight spaces, (3) Wheel material — nylon for smooth concrete, polyurethane for rough or cracked floors, rubber for outdoor dock use, (4) For cold storage, ensure hydraulic fluid is rated for your operating temperature. Electric pallet jacks reduce operator fatigue for runs over 100 feet. Share your floor conditions and pallet specs in an RFQ for a specific recommendation.' },
    ],
  },
}

// ---------------------------------------------------------------------------
// Product query helper
// ---------------------------------------------------------------------------

interface ProductCardData {
  name: string
  slug: string
  categorySlug: string
  sku: string
  brand: string
  primaryImage?: string
  shortDescription: string
  pricing: { basePrice?: number; currency: string; priceUnit?: string }
  purchaseMode: 'both' | 'buy-online' | 'rfq-only'
  availability: string
}

function mapProductToCard(product: Record<string, unknown>): ProductCardData {
  const pricing = product.pricing as Record<string, unknown> | undefined
  const brand = product.brand as Record<string, unknown> | null

  const primaryCategory = product.primaryCategory as Record<string, unknown> | string | null
  let categorySlug = 'products'
  if (primaryCategory && typeof primaryCategory === 'object') {
    const parent = (primaryCategory as Record<string, unknown>).parent as Record<string, unknown> | string | null
    if (parent && typeof parent === 'object') {
      categorySlug = (parent as Record<string, unknown>).slug as string || 'products'
    } else {
      categorySlug = (primaryCategory as Record<string, unknown>).slug as string || 'products'
    }
  }

  const primaryImageObj = product.primaryImage && typeof product.primaryImage === 'object'
    ? product.primaryImage as Record<string, unknown>
    : null
  const primaryImage = (primaryImageObj?.url as string) || (product.externalImageUrl as string) || undefined

  return {
    name: product.name as string,
    slug: product.slug as string,
    categorySlug,
    sku: product.sku as string,
    brand: brand ? (brand.name as string || 'Unbranded') : 'Unbranded',
    primaryImage,
    shortDescription: (product.shortDescription as string) || '',
    pricing: {
      basePrice: pricing?.basePrice as number | undefined,
      currency: (pricing?.currency as string) || 'USD',
      priceUnit: pricing?.priceUnit as string | undefined,
    },
    purchaseMode: (product.purchaseMode as 'both' | 'buy-online' | 'rfq-only') || 'both',
    availability: (product.availability as string) || 'contact',
  }
}

async function getIndustryProducts(industrySlug: string, limit = 8): Promise<ProductCardData[]> {
  try {
    // 使用行业名称搜索相关产品
    const industry = industryData[industrySlug]
    if (!industry) return []

    const searchTerms = industry.name.toLowerCase().split(' ')
    const result = await searchProducts(searchTerms[0], { limit })

    return result.docs.map((p) => ({
      name: p.name,
      slug: p.slug,
      categorySlug: 'products',
      sku: p.sku,
      brand: 'Unbranded',
      primaryImage: p.external_image_url || undefined,
      shortDescription: p.short_description || '',
      pricing: { basePrice: undefined, currency: 'USD', priceUnit: undefined },
      purchaseMode: (p.purchase_mode as 'both' | 'buy-online' | 'rfq-only') || 'both',
      availability: p.availability || 'contact',
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Metadata & Static Params
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const industry = industryData[slug]

  if (!industry) {
    return { title: 'Industry Not Found | Machrio' }
  }

  return {
    title: `${industry.name} Industry Solutions | Machrio`,
    description: industry.description,
    alternates: { canonical: `/industry/${slug}` },
    openGraph: {
      title: `${industry.name} Industry Solutions | Machrio`,
      description: industry.description,
    },
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const industry = industryData[slug]

  if (!industry) {
    notFound()
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  const products = await getIndustryProducts(slug)

  // --- Structured Data: CollectionPage + ItemList ---
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${industry.name} Industry Solutions`,
    description: industry.description,
    url: `${serverUrl}/industry/${slug}/`,
    isPartOf: { '@type': 'WebSite', name: 'Machrio', url: serverUrl },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable="headline"]', '[data-speakable="summary"]'],
    },
    ...(products.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${serverUrl}/product/${p.categorySlug}/${p.slug}/`,
          name: p.name,
        })),
      },
    }),
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Industries' },
    { label: industry.name },
  ]

  return (
    <div className="container-main py-12">
      <StructuredData data={collectionPageSchema} />
      <FAQSchema faqs={industry.faqs} />
      <Breadcrumbs items={breadcrumbs} />

      {/* ── Hero ── */}
      <h1 data-speakable="headline" className="text-3xl font-bold text-secondary-900">
        {industry.name} Industry Solutions
      </h1>
      <p data-speakable="summary" className="mt-3 max-w-3xl text-lg leading-relaxed text-secondary-600">
        {industry.intro}
      </p>

      {/* ── Top Products for this Industry ── */}
      {products.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary-800">
              Top Products for {industry.name}
            </h2>
            <span className="text-sm text-secondary-500">{products.length} products</span>
          </div>
          <div className="mt-4">
            <ProductGrid products={products} view="grid" />
          </div>
        </section>
      )}

      {/* ── Application Scenarios ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-secondary-800">
          Common Applications in {industry.name}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {industry.scenarios.map((scenario) => (
            <div
              key={scenario.title}
              className="rounded-lg border border-secondary-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{scenario.icon}</span>
                <div>
                  <h3 className="font-semibold text-secondary-800">{scenario.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-secondary-600">
                    {scenario.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {scenario.categories.map((catSlug) => {
                      const cat = industry.categories.find((c) => c.slug === catSlug)
                      if (!cat) return null
                      return (
                        <Link
                          key={catSlug}
                          href={`/category/${catSlug}`}
                          className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                        >
                          {cat.name} →
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recommended Categories ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-secondary-800">
          Recommended Categories for {industry.name}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {industry.categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="card text-center transition-all hover:border-primary-200 hover:shadow-md"
            >
              <span className="text-lg font-semibold text-secondary-800">{cat.name}</span>
              <span className="mt-1 block text-sm text-primary-600">Browse Products →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Compliance & Standards ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-secondary-800">
          Compliance & Standards
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary-600">
          {industry.compliance.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {industry.compliance.standards.map((std) => (
            <span
              key={std}
              className="rounded-full border border-secondary-300 bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-700"
            >
              {std}
            </span>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection
        faqs={industry.faqs}
        title={`${industry.name} FAQ`}
      />

      {/* ── CTA ── */}
      <section className="mt-12 rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-semibold text-amber-800">
          Need Products for Your {industry.name} Operation?
        </h2>
        <p className="mt-2 text-amber-700">
          Our sourcing team specializes in industrial MRO procurement.
          Tell us what you need and we&apos;ll provide a customized quote within 24 hours.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/rfq" className="btn-accent">
            Request a Quote
          </Link>
          <Link href="/category" className="btn-secondary">
            Browse All Products
          </Link>
        </div>
      </section>

      {/* ── Why Machrio ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-secondary-800">Why Choose Machrio?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <h3 className="font-semibold text-secondary-800">Volume Pricing</h3>
            <p className="mt-1 text-sm text-secondary-600">Tiered discounts on all products</p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-secondary-800">Fast Shipping</h3>
            <p className="mt-1 text-sm text-secondary-600">Same-day dispatch available</p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-secondary-800">3-Year Warranty</h3>
            <p className="mt-1 text-sm text-secondary-600">Extended warranty on all items</p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-secondary-800">Expert Support</h3>
            <p className="mt-1 text-sm text-secondary-600">AI assistant + human sourcing team</p>
          </div>
        </div>
      </section>
    </div>
  )
}
