/**
 * Generate Buying Guide Content for All L1 and L2 Categories
 * Creates professional SEO-optimized content for 226 categories
 * 
 * Usage: npx tsx scripts/generate-all-category-buying-guides.ts
 */

import { Client } from 'pg'

const databaseUrl = 'postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway'

interface CategoryContent {
  slug: string
  title: string
  sections: Array<{
    heading: string
    content: string
  }>
}

// Category content templates organized by industry
const categoryTemplates: Record<string, CategoryContent> = {
  // ========== ABRASIVES ==========
  'abrasives': {
    slug: 'abrasives',
    title: 'Abrasives',
    sections: [
      {
        heading: 'Abrasive Product Categories',
        content: 'Abrasives are categorized by form and application. Bonded abrasives include grinding wheels, cutting wheels, and mounted points for aggressive material removal. Coated abrasives such as sandpaper, sanding belts, and flap discs provide versatile finishing options. Non-woven abrasives offer conformable surface conditioning. Choose the appropriate form based on your material removal rate and finish requirements.'
      },
      {
        heading: 'Grit Size and Material Selection',
        content: 'Grit size determines material removal rate and surface finish. Coarse grits (24-60) for heavy stock removal, medium grits (80-120) for general purpose work, fine grits (150-240) for finishing, and very fine grits (320+) for polishing. Match abrasive grain to workpiece material: aluminum oxide for steel and ferrous metals, silicon carbide for non-ferrous materials and stone, zirconia alumina for high-pressure applications.'
      },
      {
        heading: 'Safety and Operating Parameters',
        content: 'Always verify maximum RPM rating exceeds tool speed. Use proper guards and personal protective equipment including eye protection and respiratory protection. Inspect abrasives before use for cracks or damage. Follow proper mounting procedures and allow tools to reach operating speed before beginning work. Store abrasives in dry conditions at stable temperature.'
      }
    ]
  },
  
  'adhesives-sealants-and-tape': {
    slug: 'adhesives-sealants-and-tape',
    title: 'Adhesives, Sealants and Tape',
    sections: [
      {
        heading: 'Adhesive Technology Selection',
        content: 'Select adhesive type based on materials being joined and performance requirements. Epoxies provide structural strength for metal and composite bonding. Cyanoacrylates offer instant bonding for small assemblies. Anaerobics cure in absence of air for threadlocking and retaining. UV cure adhesives provide rapid curing for transparent substrates. Polyurethanes offer flexibility and environmental resistance.'
      },
      {
        heading: 'Sealant Applications',
        content: 'Choose sealants based on joint movement, environmental exposure, and substrate compatibility. Silicones provide flexibility and temperature resistance for general sealing. Polyurethanes offer paintability and abrasion resistance. Polysulfides excel in fuel and chemical resistance. Consider cure mechanism: moisture cure for convenience, two-part for controlled cure, anaerobic for confined joints.'
      },
      {
        heading: 'Industrial Tape Solutions',
        content: 'Industrial tapes replace mechanical fasteners in many applications. Double-sided foam tapes provide bonding and gap filling. Masking tapes protect surfaces during painting and coating. Electrical tapes insulate wire and cable connections. Filament tapes bundle and reinforce. Consider adhesion strength, temperature resistance, and removal requirements when selecting tape.'
      }
    ]
  },
  
  'cleaning-and-janitorial': {
    slug: 'cleaning-and-janitorial',
    title: 'Cleaning and Janitorial',
    sections: [
      {
        heading: 'Cleaning Chemical Selection',
        content: 'Match cleaning chemicals to soil type and surface material. Alkaline cleaners remove oils, greases, and organic soils. Acid cleaners dissolve mineral deposits, rust, and scale. Neutral cleaners provide gentle cleaning for sensitive surfaces. Solvent cleaners degrease heavy industrial soils. Consider dilution ratios, application methods, and environmental impact.'
      },
      {
        heading: 'Cleaning Equipment and Tools',
        content: 'Select equipment based on facility size and cleaning requirements. Automatic floor scrubbers for large floor areas. Vacuum cleaners for dry pickup and liquid recovery. Pressure washers for exterior and heavy-duty cleaning. Mops, buckets, and wringers for manual cleaning. Microfiber cloths and mops provide superior soil removal and reduced chemical usage.'
      },
      {
        heading: 'Restroom and Hygiene Supplies',
        content: 'Maintain hygiene with dispensers for toilet paper, paper towels, and soap. Hand sanitizers and dispensers promote hand hygiene. Air fresheners and odor control systems maintain air quality. Waste receptacles with liners for proper waste disposal. Consider touchless dispensers to reduce cross-contamination in high-traffic restrooms.'
      }
    ]
  },
  
  'electrical': {
    slug: 'electrical',
    title: 'Electrical',
    sections: [
      {
        heading: 'Wire and Cable Selection',
        content: 'Choose wire and cable based on voltage, current, and environmental requirements. THHN/THWN for general building wiring. SOOW cord for portable equipment. Control cable for instrumentation and controls. Communication cable for data and signal transmission. Consider conductor size (AWG), insulation type, temperature rating, and jacket material for your application.'
      },
      {
        heading: 'Electrical Protection and Safety',
        content: 'Circuit breakers and fuses protect against overcurrent and short circuits. Ground fault circuit interrupters (GFCI) protect against ground faults. Arc fault circuit interrupters (AFCI) detect dangerous arc conditions. Personal protective equipment including insulated gloves, arc flash suits, and face shields protect workers. Follow NFPA 70E electrical safety requirements.'
      },
      {
        heading: 'Controls and Automation',
        content: 'Industrial controls include contactors, relays, motor starters, and variable frequency drives. Programmable logic controllers (PLCs) automate machine and process control. Sensors detect position, pressure, temperature, and flow. Human machine interfaces (HMIs) provide operator control and monitoring. Select components compatible with system voltage and communication protocols.'
      }
    ]
  },
  
  'fasteners': {
    slug: 'fasteners',
    title: 'Fasteners',
    sections: [
      {
        heading: 'Bolt and Screw Selection',
        content: 'Select fasteners based on application requirements and material compatibility. Hex bolts and cap screws for general fastening. Socket head screws for confined spaces. Self-tapping screws for sheet metal and plastic. Wood screws for lumber connections. Consider thread type (coarse or fine), head style, drive type, and material grade for your application.'
      },
      {
        heading: 'Anchors and Concrete Fasteners',
        content: 'Concrete anchors include wedge anchors, sleeve anchors, and drop-in anchors for heavy loads. Screw anchors for light to medium duty. Chemical anchors for highest strength and cracked concrete. Toggle bolts and hollow wall anchors for drywall and hollow base materials. Verify anchor capacity exceeds design loads with appropriate safety factors.'
      },
      {
        heading: 'Nuts, Washers, and Threaded Rod',
        content: 'Nuts include hex nuts, lock nuts, flange nuts, and cap nuts. Washers distribute load, prevent loosening, and isolate dissimilar materials. Threaded rod provides custom length fastening and hanging applications. Match nut and washer grade to bolt grade. Use lock washers, prevailing torque nuts, or threadlocking adhesive to prevent loosening from vibration.'
      }
    ]
  }
}

// Generic template generator for categories without specific templates
function generateGenericTemplate(name: string, slug: string, level: string): CategoryContent {
  const categoryType = getCategoryType(slug)
  
  return {
    slug,
    title: name,
    sections: [
      {
        heading: `Understanding ${name}`,
        content: `${name} are essential components for industrial, commercial, and institutional applications. Our ${name.toLowerCase()} selection includes diverse options to meet your specific requirements. Consider application requirements, performance specifications, and environmental conditions when selecting products.`
      },
      {
        heading: 'Key Selection Factors',
        content: `Match product specifications to your application requirements. Consider material compatibility, load capacity, and operating conditions. Verify compliance with applicable industry standards and regulations. Evaluate total cost of ownership including installation, maintenance, and replacement costs.`
      },
      {
        heading: 'Quality and Performance',
        content: `Choose ${categoryType} from reputable manufacturers with proven track records. Look for products with consistent quality, reliable performance, and technical support available. Consider warranty terms and availability of replacement parts. Proper selection ensures optimal performance and service life.`
      }
    ]
  }
}

// Determine category type for generic content
function getCategoryType(slug: string): string {
  if (slug.includes('safety') || slug.includes('protection')) return 'safety products'
  if (slug.includes('tool') || slug.includes('equipment')) return 'tools and equipment'
  if (slug.includes('material') || slug.includes('handling')) return 'material handling products'
  if (slug.includes('electrical')) return 'electrical products'
  if (slug.includes('plumbing')) return 'plumbing products'
  if (slug.includes('hvac')) return 'HVAC products'
  if (slug.includes('fastener')) return 'fastening products'
  if (slug.includes('abrasive')) return 'abrasive products'
  if (slug.includes('adhesive') || slug.includes('sealant')) return 'bonding and sealing products'
  return 'industrial products'
}

// Convert content to Lexical JSON format
function contentToLexical(content: CategoryContent): object {
  const children: any[] = [
    {
      tag: 'h2',
      type: 'heading',
      children: [{ text: `How to Choose the Right ${content.title}`, type: 'text' }]
    }
  ]
  
  for (const section of content.sections) {
    children.push({
      tag: 'h3',
      type: 'heading',
      children: [{ text: section.heading, type: 'text' }]
    })
    
    children.push({
      type: 'paragraph',
      children: [{ text: section.content, type: 'text' }]
    })
  }
  
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1
    }
  }
}

async function main() {
  const client = new Client({ connectionString: databaseUrl })
  
  try {
    await client.connect()
    console.log('✅ Connected to database\n')
    
    // Get all L1 and L2 categories
    const result = await client.query(`
      SELECT c.id, c.slug, c.name, 
             CASE WHEN c.parent_id IS NULL THEN 'L1' ELSE 'L2' END as level
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.parent_id IS NULL OR p.parent_id IS NULL
      ORDER BY c.name
    `)
    
    console.log(`Found ${result.rows.length} categories to update\n`)
    
    let updated = 0
    let skipped = 0
    
    for (const row of result.rows) {
      const { id, slug, name, level } = row
      
      // Check if buying_guide already exists
      const existingGuide = await client.query(
        'SELECT buying_guide FROM categories WHERE id = $1',
        [id]
      )
      
      if (existingGuide.rows[0]?.buying_guide) {
        console.log(`⏭️  Skipping ${name} (${slug}) - already has content`)
        skipped++
        continue
      }
      
      // Generate content
      let content: CategoryContent
      
      if (categoryTemplates[slug]) {
        content = categoryTemplates[slug]
      } else {
        content = generateGenericTemplate(name, slug, level)
      }
      
      // Convert to Lexical format
      const lexicalContent = contentToLexical(content)
      
      // Update database
      await client.query(
        'UPDATE categories SET buying_guide = $1::jsonb WHERE id = $2',
        [JSON.stringify(lexicalContent), id]
      )
      
      console.log(`✅ Updated ${level} - ${name} (${slug})`)
      updated++
    }
    
    console.log(`\n✅ Complete!`)
    console.log(`   Updated: ${updated} categories`)
    console.log(`   Skipped: ${skipped} categories`)
    console.log(`   Total: ${result.rows.length} categories`)
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
