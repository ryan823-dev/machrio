/**
 * Seed script for glossary terms
 * Run: node scripts/seed-glossary-terms.cjs
 */
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'

const terms = [
  // ── Safety & Compliance ──
  {
    term: 'PPE',
    slug: 'ppe',
    fullName: 'Personal Protective Equipment',
    definition: 'Equipment worn to minimize exposure to hazards that cause serious workplace injuries and illnesses. PPE includes items such as hard hats, safety glasses, gloves, respirators, high-visibility clothing, and safety footwear.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'LOTO',
    slug: 'loto',
    fullName: 'Lockout/Tagout',
    definition: 'A safety procedure used to ensure that dangerous machines and energy sources are properly shut off and not able to be started up again before maintenance or servicing is completed. Required by OSHA standard 29 CFR 1910.147.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'OSHA',
    slug: 'osha',
    fullName: 'Occupational Safety and Health Administration',
    definition: 'A U.S. federal agency under the Department of Labor responsible for setting and enforcing workplace safety and health standards. OSHA regulations cover everything from fall protection to hazardous materials handling.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'SDS',
    slug: 'sds',
    fullName: 'Safety Data Sheet',
    definition: 'A document that provides detailed information about a chemical product, including its properties, hazards, safe handling procedures, storage requirements, and emergency measures. Required under OSHA Hazard Communication Standard (HCS).',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'GHS',
    slug: 'ghs',
    fullName: 'Globally Harmonized System of Classification and Labelling of Chemicals',
    definition: 'An internationally agreed-upon system for classifying and communicating chemical hazards through standardized labels and safety data sheets. GHS uses pictograms, signal words, and hazard statements to convey risk information.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'ANSI',
    slug: 'ansi',
    fullName: 'American National Standards Institute',
    definition: 'A private, non-profit organization that oversees the development of voluntary consensus standards for products, services, and systems in the United States. ANSI standards are widely referenced in industrial safety equipment specifications.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'NRR',
    slug: 'nrr',
    fullName: 'Noise Reduction Rating',
    definition: 'A unit of measurement used to determine the effectiveness of hearing protection devices in reducing noise exposure. Measured in decibels (dB), a higher NRR indicates greater noise reduction. Common in earmuffs and earplugs specifications.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'Arc Flash',
    slug: 'arc-flash',
    fullName: null,
    definition: 'A dangerous electrical explosion that occurs when an electric current flows through an air gap between conductors, creating a bright flash, intense heat (up to 35,000°F), and a pressure wave. Arc-rated PPE is required for workers exposed to arc flash hazards.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'FR',
    slug: 'fr',
    fullName: 'Flame Resistant',
    definition: 'A property of materials that resist ignition or self-extinguish when exposed to flame. FR clothing and materials are essential PPE in industries with fire, arc flash, or flash fire hazards such as oil & gas, electrical utilities, and welding.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'RoHS',
    slug: 'rohs',
    fullName: 'Restriction of Hazardous Substances',
    definition: 'An EU directive that restricts the use of specific hazardous materials (lead, mercury, cadmium, etc.) found in electrical and electronic products. RoHS compliance is mandatory for products sold in the European Union.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'REACH',
    slug: 'reach',
    fullName: 'Registration, Evaluation, Authorisation and Restriction of Chemicals',
    definition: 'A European Union regulation addressing the production and use of chemical substances and their potential impact on human health and the environment. Manufacturers and importers must register chemicals produced or imported in quantities above one tonne per year.',
    category: 'standards',
    status: 'published',
  },

  // ── Maintenance & Operations ──
  {
    term: 'MRO',
    slug: 'mro',
    fullName: 'Maintenance, Repair, and Operations',
    definition: 'The category of supplies, equipment, and activities required to keep a facility, plant, or operation running. MRO encompasses everything from replacement parts and lubricants to cleaning supplies, safety equipment, and hand tools.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'Preventive Maintenance',
    slug: 'preventive-maintenance',
    fullName: null,
    definition: 'A proactive maintenance strategy that involves regular, planned maintenance activities performed on equipment to reduce the likelihood of failure. Includes routine inspections, lubrication, adjustments, cleaning, and parts replacement on a scheduled basis.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'MTBF',
    slug: 'mtbf',
    fullName: 'Mean Time Between Failures',
    definition: 'A reliability metric that measures the average time elapsed between inherent failures of a mechanical or electronic system during normal operation. Higher MTBF values indicate more reliable equipment. Commonly used in maintenance planning and equipment procurement.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'CMMS',
    slug: 'cmms',
    fullName: 'Computerized Maintenance Management System',
    definition: 'Software that centralizes maintenance information and facilitates the processes of maintenance operations. CMMS helps organizations manage work orders, schedule preventive maintenance, track spare parts inventory, and generate reports.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'Downtime',
    slug: 'downtime',
    fullName: null,
    definition: 'A period when a machine, system, or production line is not operational due to equipment failure, maintenance, or other reasons. Unplanned downtime can result in significant production losses and increased costs, making MRO procurement critical.',
    category: 'maintenance',
    status: 'published',
  },

  // ── Materials & Components ──
  {
    term: 'Abrasion Resistance',
    slug: 'abrasion-resistance',
    fullName: null,
    definition: 'The ability of a material to withstand mechanical action such as rubbing, scraping, or erosion that tends to remove material from the surface. Critical specification for gloves, footwear, conveyor belts, and industrial coatings.',
    category: 'materials',
    status: 'published',
  },
  {
    term: 'Tensile Strength',
    slug: 'tensile-strength',
    fullName: null,
    definition: 'The maximum stress a material can withstand while being stretched or pulled before breaking, typically measured in PSI or MPa. A key specification for lifting slings, wire rope, chains, bolts, and structural components.',
    category: 'materials',
    status: 'published',
  },
  {
    term: 'IP Rating',
    slug: 'ip-rating',
    fullName: 'Ingress Protection Rating',
    definition: 'A two-digit code (e.g., IP65, IP67) that classifies the degree of protection provided by enclosures against intrusion of solid particles (first digit, 0-6) and water (second digit, 0-9). Higher numbers indicate greater protection. Essential for selecting electrical equipment for harsh environments.',
    category: 'materials',
    status: 'published',
  },
  {
    term: 'Durometer',
    slug: 'durometer',
    fullName: null,
    definition: 'A measurement of the hardness of rubber, elastomer, and polymer materials. Measured on scales such as Shore A (softer) and Shore D (harder). Important specification for O-rings, gaskets, seals, wheels, and vibration dampening products.',
    category: 'materials',
    status: 'published',
  },

  // ── Procurement & Supply Chain ──
  {
    term: 'MOQ',
    slug: 'moq',
    fullName: 'Minimum Order Quantity',
    definition: 'The lowest quantity of a product that a supplier is willing to sell in a single order. MOQs are common in B2B industrial procurement and can vary significantly between standard catalog items and custom-manufactured products.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'DDP',
    slug: 'ddp',
    fullName: 'Delivered Duty Paid',
    definition: 'An international trade term (Incoterm) where the seller bears all costs and risks of delivering goods to the buyer\'s location, including import duties, taxes, and customs clearance. DDP provides the highest level of convenience for the buyer.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'RFQ',
    slug: 'rfq',
    fullName: 'Request for Quotation',
    definition: 'A formal document sent to potential suppliers inviting them to submit a price quote for specified products or services. In B2B industrial procurement, RFQs typically include product specifications, quantities, delivery requirements, and payment terms.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'Lead Time',
    slug: 'lead-time',
    fullName: null,
    definition: 'The total time from placing an order to receiving the goods, including production time, quality inspection, packaging, and shipping transit. Lead time is a critical factor in MRO procurement planning to prevent stockouts and production delays.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'SKU',
    slug: 'sku',
    fullName: 'Stock Keeping Unit',
    definition: 'A unique alphanumeric identifier assigned to a product for inventory management and tracking purposes. Each distinct product (including variations in size, color, or packaging) receives its own SKU to enable accurate stock control and order fulfillment.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'FOB',
    slug: 'fob',
    fullName: 'Free On Board',
    definition: 'An international trade term indicating the point at which the seller\'s responsibility for goods ends and the buyer assumes risk and cost. "FOB Origin" means the buyer takes responsibility once goods leave the seller\'s facility; "FOB Destination" means the seller bears risk until delivery.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'BOM',
    slug: 'bom',
    fullName: 'Bill of Materials',
    definition: 'A comprehensive list of raw materials, components, assemblies, and quantities required to manufacture or maintain a product or system. BOMs are essential for procurement planning, cost estimation, and inventory management in manufacturing operations.',
    category: 'procurement',
    status: 'published',
  },

  // ── Tools & Equipment ──
  {
    term: 'Torque',
    slug: 'torque',
    fullName: null,
    definition: 'A rotational force applied to an object, measured in units such as Newton-meters (Nm), foot-pounds (ft-lb), or inch-pounds (in-lb). Torque specifications are critical for proper fastener tightening, power tool selection, and motor sizing in industrial applications.',
    category: 'tools',
    status: 'published',
  },
  {
    term: 'CFM',
    slug: 'cfm',
    fullName: 'Cubic Feet per Minute',
    definition: 'A unit of measurement for the volume of air flow, commonly used to rate air compressors, pneumatic tools, ventilation systems, and dust collection equipment. Matching CFM requirements to tool demands is essential for proper pneumatic system design.',
    category: 'tools',
    status: 'published',
  },
  {
    term: 'RPM',
    slug: 'rpm',
    fullName: 'Revolutions Per Minute',
    definition: 'A measure of rotational speed indicating the number of complete turns a rotating object makes per minute. RPM is a key specification for motors, power tools, grinding wheels, drill bits, and rotating machinery. Proper RPM matching prevents tool damage and ensures optimal performance.',
    category: 'tools',
    status: 'published',
  },
]

async function seedGlossary() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  console.log('Connected to MongoDB')

  const db = client.db('machrio')
  const collection = db.collection('glossary-terms')

  // Check existing
  const existing = await collection.countDocuments()
  if (existing > 0) {
    console.log(`Collection already has ${existing} terms. Skipping seed to avoid duplicates.`)
    console.log('To re-seed, run: db.collection("glossary-terms").drop() first')
    await client.close()
    return
  }

  const now = new Date().toISOString()
  const docs = terms.map((t) => ({
    ...t,
    relatedTerms: [],
    relatedCategories: [],
    seo: {},
    createdAt: now,
    updatedAt: now,
  }))

  const result = await collection.insertMany(docs)
  console.log(`\n=== Inserted ${result.insertedCount} glossary terms ===\n`)

  // Print summary by category
  const byCat = new Map()
  for (const t of terms) {
    byCat.set(t.category, (byCat.get(t.category) || 0) + 1)
  }
  for (const [cat, count] of byCat) {
    console.log(`  ${cat}: ${count} terms`)
  }

  // Create indexes
  await collection.createIndex({ slug: 1 }, { unique: true })
  await collection.createIndex({ status: 1 })
  await collection.createIndex({ category: 1 })
  await collection.createIndex({ term: 1 })
  console.log('\nIndexes created')

  await client.close()
  console.log('Done!')
}

seedGlossary().catch(console.error)
