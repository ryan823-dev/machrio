/**
 * Generate FAQ Content for All L1 and L2 Categories
 * Creates professional FAQs for 226 categories
 * 
 * Usage: npx tsx scripts/generate-all-category-faqs.ts
 */

import { Client } from 'pg'

const databaseUrl = 'postgresql://postgres:sGmPTCagRVFtHszbygRzSvYTdUXgCFfH@crossover.proxy.rlwy.net:38475/railway'

interface FAQItem {
  question: string
  answer: string
}

interface CategoryFAQ {
  slug: string
  title: string
  faqs: FAQItem[]
}

// FAQ templates for major categories
const faqTemplates: Record<string, CategoryFAQ> = {
  // ABRASIVES
  'abrasives': {
    slug: 'abrasives',
    title: 'Abrasives',
    faqs: [
      {
        question: 'What grit should I choose for my application?',
        answer: 'Grit selection depends on your desired finish. Coarse grits (24-60) are for heavy stock removal, medium grits (80-120) for general purpose work, fine grits (150-240) for finishing, and very fine grits (320+) for polishing applications.'
      },
      {
        question: 'What is the difference between bonded and coated abrasives?',
        answer: 'Bonded abrasives (grinding wheels, cutting wheels) are for aggressive material removal and precision grinding. Coated abrasives (sandpaper, belts, discs) provide versatile finishing options for surface preparation and polishing.'
      },
      {
        question: 'How do I know the maximum RPM for an abrasive wheel?',
        answer: 'The maximum RPM is always marked on the wheel itself. Never exceed this rating. Always verify that your tool speed is equal to or less than the wheel maximum RPM for safe operation.'
      }
    ]
  },
  
  // ELECTRICAL
  'electrical': {
    slug: 'electrical',
    title: 'Electrical',
    faqs: [
      {
        question: 'What wire gauge do I need for my application?',
        answer: 'Wire gauge selection depends on amperage and distance. For general household wiring, 14 AWG is for 15-amp circuits, 12 AWG for 20-amp circuits, and 10 AWG for 30-amp circuits. Always consult local electrical codes.'
      },
      {
        question: 'What is the difference between THHN and THWN wire?',
        answer: 'THHN is rated for dry locations up to 90°C. THWN is rated for wet locations up to 75°C. Many modern wires are dual-rated THHN/THWN, making them suitable for both dry and wet locations.'
      },
      {
        question: 'Do I need a GFCI or AFCI circuit breaker?',
        answer: 'GFCI (Ground Fault Circuit Interrupter) protects against ground faults and is required in wet areas. AFCI (Arc Fault Circuit Interrupter) detects dangerous arc conditions and is required in living areas. Some breakers combine both functions.'
      }
    ]
  },
  
  // FASTENERS
  'fasteners': {
    slug: 'fasteners',
    title: 'Fasteners',
    faqs: [
      {
        question: 'What is the difference between Grade 5 and Grade 8 bolts?',
        answer: 'Grade 8 bolts have higher tensile strength (150,000 PSI) compared to Grade 5 (120,000 PSI). Use Grade 8 for high-stress applications like automotive and heavy equipment. Grade 5 is suitable for general purpose fastening.'
      },
      {
        question: 'When should I use stainless steel fasteners?',
        answer: 'Stainless steel fasteners offer excellent corrosion resistance and are ideal for outdoor, marine, and chemical environments. They are also preferred in food processing and medical applications for hygiene requirements.'
      },
      {
        question: 'What anchor should I use for concrete?',
        answer: 'For heavy loads, use wedge anchors or sleeve anchors. For light to medium duty, use screw anchors. For the highest strength or cracked concrete, use chemical anchors. Always verify anchor capacity exceeds your design loads.'
      }
    ]
  },
  
  // SAFETY
  'safety': {
    slug: 'safety',
    title: 'Safety',
    faqs: [
      {
        question: 'What type of safety gloves do I need?',
        answer: 'Glove selection depends on the hazard. Cut-resistant gloves (ANSI levels A1-A9) protect against sharp edges. Chemical-resistant gloves protect against specific chemicals. Heat-resistant gloves protect against high temperatures. Match glove material to your specific hazard.'
      },
      {
        question: 'When is respiratory protection required?',
        answer: 'Respiratory protection is required when exposure to dust, fumes, mists, gases, or vapors exceeds permissible exposure limits. Conduct air quality testing and select respirators based on the specific contaminants present.'
      },
      {
        question: 'What does ANSI Z87.1 mean for safety glasses?',
        answer: 'ANSI Z87.1 is the American National Standard for Occupational and Educational Personal Eye and Face Protection Devices. Glasses marked Z87+ meet high-impact requirements and provide adequate protection for most industrial applications.'
      }
    ]
  },
  
  // MATERIAL HANDLING
  'material-handling': {
    slug: 'material-handling',
    title: 'Material Handling',
    faqs: [
      {
        question: 'How do I choose the right pallet jack?',
        answer: 'Consider load capacity (typically 4,500-5,500 lbs), fork length (to fit your pallets), and lift height. Manual pallet jacks are economical for occasional use. Electric pallet jacks reduce operator fatigue for high-volume applications.'
      },
      {
        question: 'What capacity lift table do I need?',
        answer: 'Choose a lift table with capacity 20-25% greater than your maximum load. Consider platform size, lift height, and lowered height. Scissor lift tables are common for ergonomic positioning and material handling applications.'
      },
      {
        question: 'When should I use a drum handler?',
        answer: 'Drum handlers are essential for safe drum transport and positioning. Use drum lifters for vertical lifting, drum dollies for horizontal transport, and drum grabbers for pouring. Always verify compatibility with your drum size (30 or 55 gallon).'
      }
    ]
  },
  
  // LIGHTING
  'lighting': {
    slug: 'lighting',
    title: 'Lighting',
    faqs: [
      {
        question: 'What is the difference between lumens and watts?',
        answer: 'Lumens measure light output (brightness), while watts measure energy consumption. LED bulbs produce more lumens per watt than incandescent or fluorescent bulbs. Focus on lumens when selecting brightness for your application.'
      },
      {
        question: 'What color temperature should I choose?',
        answer: 'Color temperature is measured in Kelvin (K). 2700K-3000K (warm white) for residential and hospitality. 3500K-4100K (neutral white) for offices and retail. 5000K-6500K (daylight) for task lighting and detailed work areas.'
      },
      {
        question: 'Are LED lights worth the extra cost?',
        answer: 'Yes. LED lights use 75-80% less energy than incandescent, last 25 times longer, and produce less heat. While initial cost is higher, LED provides significant long-term savings in energy and replacement costs.'
      }
    ]
  },
  
  // ADHESIVES
  'adhesives-sealants-and-tape': {
    slug: 'adhesives-sealants-and-tape',
    title: 'Adhesives, Sealants and Tape',
    faqs: [
      {
        question: 'Which adhesive is strongest for metal bonding?',
        answer: 'Two-part epoxies provide the strongest bonds for metal-to-metal applications, offering structural strength and excellent chemical resistance. For quick repairs, cyanoacrylates (super glue) work well for small assemblies.'
      },
      {
        question: 'What sealant should I use for outdoor applications?',
        answer: 'Silicone sealants offer excellent UV resistance and flexibility for outdoor use. They maintain adhesion and flexibility in extreme temperatures (-60°F to 400°F). For paintable applications, use polyurethane sealants.'
      },
      {
        question: 'How long does adhesive take to cure?',
        answer: 'Cure time varies by adhesive type. Cyanoacrylates cure in seconds to minutes. Epoxies typically cure in 5-30 minutes with full strength in 24 hours. Polyurethanes may take 24-72 hours for full cure. Always follow manufacturer recommendations.'
      }
    ]
  },
  
  // HVAC
  'hvac-and-refrigeration': {
    slug: 'hvac-and-refrigeration',
    title: 'HVAC and Refrigeration',
    faqs: [
      {
        question: 'How often should I replace air filters?',
        answer: 'Standard filters should be replaced every 30-90 days. High-efficiency filters may last 3-6 months. Replace more frequently in high-dust environments or during peak heating/cooling seasons for optimal system efficiency.'
      },
      {
        question: 'What size HVAC unit do I need?',
        answer: 'HVAC sizing depends on square footage, insulation, ceiling height, and climate. A professional load calculation (Manual J) is recommended. Oversized units cycle frequently, while undersized units struggle to maintain temperature.'
      },
      {
        question: 'What is the SEER rating?',
        answer: 'SEER (Seasonal Energy Efficiency Ratio) measures air conditioning efficiency. Higher SEER ratings indicate better efficiency. Current minimum is 14 SEER in most regions. High-efficiency units can reach 20+ SEER, reducing energy costs.'
      }
    ]
  },
  
  // TOOLS
  'tools': {
    slug: 'tools',
    title: 'Tools',
    faqs: [
      {
        question: 'Should I buy corded or cordless power tools?',
        answer: 'Cordless tools offer portability and convenience for most applications. Modern lithium-ion batteries provide excellent runtime. Corded tools provide continuous power for high-demand applications like large saws or stationary equipment.'
      },
      {
        question: 'What size air compressor do I need?',
        answer: 'Compressor size depends on your tools\' CFM requirements. For nail guns, 2-5 CFM at 90 PSI is typical. For sanders and grinders, expect 10-20 CFM. Add 30-50% to total CFM for future expansion.'
      },
      {
        question: 'How do I choose the right hand tools?',
        answer: 'Invest in quality chrome vanadium steel tools for durability. Look for lifetime warranties. Choose sizes based on your applications: SAE (imperial) for automotive, metric for equipment and machinery. Consider tool storage for organization.'
      }
    ]
  },
  
  // CLEANING
  'cleaning-and-janitorial': {
    slug: 'cleaning-and-janitorial',
    title: 'Cleaning and Janitorial',
    faqs: [
      {
        question: 'What cleaner should I use for grease removal?',
        answer: 'Alkaline cleaners are most effective for grease and oil removal. Degreasers with citrus solvents work well for heavy industrial soils. For food service areas, use NSF-approved cleaners that are safe for food contact surfaces.'
      },
      {
        question: 'How do I choose the right mop for my facility?',
        answer: 'String mops are economical for general cleaning. Microfiber mops remove more soil with less chemical. Flat mops are ideal for hard floors. Consider mop head size, handle material, and laundering requirements.'
      },
      {
        question: 'What paper products do I need for my restroom?',
        answer: 'Essential items include toilet paper, paper towels, and hand soap. Consider dispenser capacity based on traffic. Touchless dispensers reduce cross-contamination. Calculate usage based on employee count and visitor volume.'
      }
    ]
  }
}

// Generic FAQ generator for categories without specific templates
function generateGenericFAQ(name: string, slug: string): CategoryFAQ {
  const categoryType = getCategoryType(slug)
  
  return {
    slug,
    title: name,
    faqs: [
      {
        question: `What should I consider when selecting ${name.toLowerCase()}?`,
        answer: `Consider your specific application requirements, performance specifications, and environmental conditions. Evaluate factors such as load capacity, material compatibility, operating temperature, and compliance with industry standards. Review product specifications carefully to ensure proper selection.`
      },
      {
        question: `Are your ${name.toLowerCase()} compliant with industry standards?`,
        answer: `We offer ${categoryType} from reputable manufacturers that meet relevant industry standards and certifications. Specific compliance varies by product. Check individual product specifications for details on UL listing, ANSI compliance, OSHA requirements, or other applicable standards.`
      },
      {
        question: `How do I maintain ${name.toLowerCase()}?`,
        answer: `Proper maintenance depends on the specific product type. Generally, regular inspection, cleaning, and following manufacturer guidelines will extend product life. Store in appropriate conditions and replace worn or damaged items promptly. Refer to product documentation for specific maintenance schedules.`
      }
    ]
  }
}

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
      
      // Check if FAQ already exists
      const existingFAQ = await client.query(
        'SELECT faq FROM categories WHERE id = $1',
        [id]
      )
      
      const currentFAQ = existingFAQ.rows[0]?.faq || []
      if (Array.isArray(currentFAQ) && currentFAQ.length > 0) {
        console.log(`⏭️  Skipping ${name} (${slug}) - already has ${currentFAQ.length} FAQs`)
        skipped++
        continue
      }
      
      // Generate FAQ content
      let faqData: CategoryFAQ
      
      if (faqTemplates[slug]) {
        faqData = faqTemplates[slug]
      } else {
        faqData = generateGenericFAQ(name, slug)
      }
      
      // Update database
      await client.query(
        'UPDATE categories SET faq = $1::jsonb WHERE id = $2',
        [JSON.stringify(faqData.faqs), id]
      )
      
      console.log(`✅ Updated ${level} - ${name} (${slug}) - ${faqData.faqs.length} FAQs`)
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
