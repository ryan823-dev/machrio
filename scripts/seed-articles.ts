// Seed script for Knowledge Center articles
// Run with: npx tsx scripts/seed-articles.ts

import { getPayload } from 'payload'
import config from '../src/payload/payload.config'

// ---------------------------------------------------------------------------
// Lexical Rich Text Helpers
// ---------------------------------------------------------------------------

type LexicalNode = {
  type: string
  version: number
  [key: string]: unknown
}

function text(content: string, format: number = 0): LexicalNode {
  return {
    mode: 'normal',
    text: content,
    type: 'text',
    format, // 0=normal, 1=bold, 2=italic, 3=bold+italic
    style: '',
    detail: 0,
    version: 1,
  }
}

function paragraph(children: LexicalNode[]): LexicalNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children,
    direction: 'ltr' as const,
    textFormat: 0,
    textStyle: '',
  }
}

function heading(tag: 'h2' | 'h3', content: string): LexicalNode {
  return {
    type: 'heading',
    format: '',
    indent: 0,
    version: 1,
    children: [text(content)],
    direction: 'ltr' as const,
    tag,
  }
}

function listItem(content: string): LexicalNode {
  return {
    type: 'listitem',
    format: '',
    indent: 0,
    version: 1,
    value: 1,
    children: [text(content)],
    direction: 'ltr' as const,
  }
}

function bulletList(items: string[]): LexicalNode {
  return {
    type: 'list',
    format: '',
    indent: 0,
    version: 1,
    listType: 'bullet',
    start: 1,
    tag: 'ul',
    direction: 'ltr' as const,
    children: items.map(listItem),
  }
}

function richTextDoc(children: LexicalNode[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      children,
      direction: 'ltr' as const,
    },
  }
}

// ---------------------------------------------------------------------------
// Article Content
// ---------------------------------------------------------------------------

const articles = [
  {
    title: 'How to Choose Cut-Resistant Gloves: ANSI/ISEA 105 Levels Explained',
    slug: 'how-to-choose-cut-resistant-gloves',
    excerpt: 'A complete guide to selecting the right cut-resistant gloves for your application. Understand ANSI/ISEA 105-2024 cut levels A1-A9, material options, and matching protection to workplace hazards.',
    category: 'buying-guide',
    tags: ['safety', 'gloves', 'PPE', 'cut-resistant', 'ANSI'],
    author: 'Machrio Team',
    content: richTextDoc([
      paragraph([text('Selecting the right cut-resistant gloves is critical for workplace safety. This guide explains the ANSI/ISEA 105-2024 standard and helps you match protection levels to your specific applications.')]),
      
      heading('h2', 'Understanding ANSI/ISEA 105-2024 Cut Levels'),
      paragraph([text('The ANSI/ISEA 105-2024 standard classifies cut resistance into nine levels (A1-A9) based on the force (in grams) required to cut through the material using a standardized test method (ASTM F2992-15).')]),
      
      heading('h3', 'Cut Level Reference Table'),
      paragraph([text('A1: 200-499 grams — Light-duty tasks, packaging, light assembly'), text('. ', 0)]),
      paragraph([text('A2: 500-999 grams — General material handling, automotive assembly'), text('. ', 0)]),
      paragraph([text('A3: 1000-1499 grams — Small parts handling, light metal work'), text('. ', 0)]),
      paragraph([text('A4: 1500-2199 grams — Sheet metal, glass handling, stamping'), text('. ', 0)]),
      paragraph([text('A5: 2200-2999 grams — Heavy metal fabrication, HVAC'), text('. ', 0)]),
      paragraph([text('A6: 3000-3999 grams — Metal stamping, recycling, demolition'), text('. ', 0)]),
      paragraph([text('A7: 4000-4999 grams — Sharp metal handling, blade changes'), text('. ', 0)]),
      paragraph([text('A8: 5000-5999 grams — Extreme cut hazards, razor-sharp materials'), text('. ', 0)]),
      paragraph([text('A9: 6000+ grams — Maximum protection, specialized applications'), text('. ', 0)]),
      
      heading('h2', 'Matching Cut Levels to Applications'),
      
      heading('h3', 'Manufacturing & Assembly'),
      bulletList([
        'A2: General assembly, packaging, light material handling',
        'A3-A4: Automotive parts, appliance assembly, small metal components',
        'A5-A6: Sheet metal fabrication, stamping operations',
      ]),
      
      heading('h3', 'Construction'),
      bulletList([
        'A4: Drywall, framing, general carpentry',
        'A5-A6: Metal stud work, HVAC installation, roofing with metal',
        'A7+: Working with sharp sheet metal, demolition',
      ]),
      
      heading('h3', 'Food Processing'),
      bulletList([
        'A4: General food handling with knives',
        'A5-A7: Meat processing, deboning operations',
        'Choose blue or metal-detectable gloves for HACCP compliance',
      ]),
      
      heading('h3', 'Glass & Window Industries'),
      bulletList([
        'A4-A5: Tempered glass handling',
        'A6-A7: Raw glass cutting, mirror work',
        'A8-A9: Broken glass cleanup, recycling',
      ]),
      
      heading('h2', 'Material Options'),
      
      heading('h3', 'HPPE (High-Performance Polyethylene)'),
      paragraph([text('Most common cut-resistant fiber. Lightweight, comfortable, good cut resistance. Best for: general industrial use where dexterity matters.')]),
      
      heading('h3', 'Kevlar / Aramid'),
      paragraph([text('Heat-resistant up to 800°F. Yellow color. Best for: applications combining cut and heat hazards like welding, glass handling.')]),
      
      heading('h3', 'Steel/Stainless Steel Fiber'),
      paragraph([text('Highest cut resistance but heavier. Best for: maximum protection in meat processing, metal recycling.')]),
      
      heading('h3', 'Composite Blends'),
      paragraph([text('Multiple fibers combined for optimized performance. Check the specific blend for your application requirements.')]),
      
      heading('h2', 'Coating Options'),
      bulletList([
        'Polyurethane (PU): Dry grip, good dexterity, clean environments',
        'Nitrile: Oil and abrasion resistance, wet/dry grip',
        'Sandy Nitrile: Enhanced grip in oily conditions',
        'Latex: Excellent grip but allergen concerns',
        'Uncoated: Maximum breathability, light tasks',
      ]),
      
      heading('h2', 'Key Selection Criteria'),
      bulletList([
        'Identify the primary cut hazard and required ANSI level',
        'Consider secondary hazards: heat, chemicals, abrasion',
        'Match coating to grip requirements (dry vs. oily)',
        'Balance protection with dexterity needs',
        'Factor in comfort for extended wear',
        'For food: require blue color and metal-detectable options',
        'For regulatory: verify gloves meet your industry standards',
      ]),
      
      heading('h2', 'Common Mistakes to Avoid'),
      bulletList([
        'Over-specifying: A9 gloves are overkill for light assembly',
        'Under-specifying: A2 gloves on sheet metal lines cause injuries',
        'Ignoring dexterity: Heavy gloves reduce productivity and may cause accidents',
        'Wrong coating: PU coating in oily environments loses grip',
        'Skipping trials: Always test gloves with actual workers before bulk orders',
      ]),
      
      heading('h2', 'Next Steps'),
      paragraph([text('Browse our '), text('Safety & PPE', 1), text(' category for cut-resistant gloves rated A1 through A9. Need help selecting the right glove for your application? Use our '), text('AI Sourcing Assistant', 1), text(' or '), text('request a quote', 1), text(' with your specific requirements.')]),
    ]),
    seo: {
      metaTitle: 'Cut-Resistant Gloves Guide: ANSI/ISEA 105 Levels A1-A9',
      metaDescription: 'Learn how to choose cut-resistant gloves by ANSI/ISEA 105-2024 level. Match A1-A9 protection to your application with our complete buying guide.',
    },
  },
  
  {
    title: 'Safety Glasses Buying Guide: ANSI Z87.1 Requirements and Lens Options',
    slug: 'safety-glasses-buying-guide-ansi-z87',
    excerpt: 'Understand ANSI Z87.1 safety eyewear requirements, impact ratings (Z87+ vs basic), lens materials, tints, and coatings. Choose the right eye protection for your workplace hazards.',
    category: 'buying-guide',
    tags: ['safety', 'eyewear', 'PPE', 'ANSI Z87.1', 'glasses'],
    author: 'Machrio Team',
    content: richTextDoc([
      paragraph([text('Eye injuries are among the most preventable workplace incidents. This guide explains ANSI Z87.1 safety eyewear requirements and helps you select the right protection for your specific hazards.')]),
      
      heading('h2', 'Understanding ANSI Z87.1 Markings'),
      paragraph([text('The ANSI Z87.1 standard sets minimum requirements for safety eyewear. Look for these markings on compliant products:')]),
      
      heading('h3', 'Impact Ratings'),
      paragraph([text('Z87', 1), text(' — Basic impact protection. Passes drop ball test (1-inch steel ball from 50 inches).')]),
      paragraph([text('Z87+', 1), text(' — High impact protection. Passes high-velocity test (1/4-inch steel ball at 150 fps for spectacles, 250 fps for goggles).')]),
      
      heading('h3', 'Additional Markings'),
      bulletList([
        'D3 — Splash/droplet protection',
        'D4 — Dust protection',
        'D5 — Fine dust protection',
        'W (shade number) — Welding filter lens',
        'U (scale number) — UV filtering',
        'R (scale number) — IR filtering',
        'L (scale number) — Visible light filtering',
        'V — Photochromic lens',
        'S — Special-purpose lens',
      ]),
      
      heading('h2', 'Lens Materials'),
      
      heading('h3', 'Polycarbonate'),
      paragraph([text('Most common material for safety eyewear. Lightweight, impact-resistant, built-in UV protection. Best for: general industrial use, most applications.')]),
      
      heading('h3', 'Trivex'),
      paragraph([text('Higher optical clarity than polycarbonate, similar impact resistance. Best for: precision work requiring clear vision.')]),
      
      heading('h3', 'Glass'),
      paragraph([text('Best scratch resistance and optical clarity. Heavier, can shatter. Best for: chemical environments where plastic degrades.')]),
      
      heading('h3', 'CR-39 (Plastic)'),
      paragraph([text('Lightweight, good optics, lower impact resistance. Best for: low-hazard environments, prescription safety glasses.')]),
      
      heading('h2', 'Lens Tints and Coatings'),
      
      heading('h3', 'Common Tints'),
      bulletList([
        'Clear — Indoor general use, maximum light transmission',
        'Gray — Outdoor use, reduces brightness without color distortion',
        'Amber/Yellow — Low-light enhancement, increases contrast',
        'Indoor/Outdoor — Photochromic, adapts to light conditions',
        'Blue Mirror — Outdoor, reduces glare from reflective surfaces',
        'Welding Shades (3-14) — Arc welding protection by shade number',
      ]),
      
      heading('h3', 'Lens Coatings'),
      bulletList([
        'Anti-fog — Reduces fogging in humid conditions or temperature changes',
        'Anti-scratch — Extends lens life in abrasive environments',
        'Anti-static — Prevents dust attraction in clean rooms',
        'Mirror — Reduces glare, outdoor applications',
        'Polarized — Eliminates glare from horizontal surfaces (water, metal)',
      ]),
      
      heading('h2', 'Frame Styles'),
      
      heading('h3', 'Spectacles'),
      paragraph([text('Standard glasses style. Lightweight, comfortable for extended wear. Side shields required for Z87.1 compliance.')]),
      
      heading('h3', 'Goggles'),
      paragraph([text('Full seal around eyes. Required for splash, dust, or chemical hazards. Choose direct or indirect ventilation based on application.')]),
      
      heading('h3', 'Face Shields'),
      paragraph([text('Full face coverage. Must be worn WITH safety glasses underneath for Z87.1 compliance. Required for grinding, chipping, severe splash.')]),
      
      heading('h3', 'Over-the-Glass (OTG)'),
      paragraph([text('Fits over prescription eyewear. Alternative to prescription safety glasses for occasional use.')]),
      
      heading('h2', 'Application Selection Guide'),
      
      heading('h3', 'General Manufacturing'),
      bulletList([
        'Z87+ spectacles with side shields',
        'Clear lens for indoor, gray for outdoor',
        'Anti-fog coating if environment is humid',
      ]),
      
      heading('h3', 'Chemical Handling'),
      bulletList([
        'Z87+ goggles with indirect ventilation (D3 rated)',
        'Clear lens',
        'Anti-fog is critical',
        'Face shield for splash potential',
      ]),
      
      heading('h3', 'Welding'),
      bulletList([
        'Welding helmet or goggles with correct shade number',
        'Shade 3-5 for torch brazing/cutting',
        'Shade 8-12 for MIG welding',
        'Shade 10-14 for arc welding',
        'Clear safety glasses underneath',
      ]),
      
      heading('h3', 'Grinding/Chipping'),
      bulletList([
        'Z87+ spectacles AND face shield',
        'Clear or amber lens',
        'Anti-scratch coating essential',
      ]),
      
      heading('h2', 'Common Mistakes to Avoid'),
      bulletList([
        'Using non-rated sunglasses as safety eyewear',
        'Wearing face shield without safety glasses underneath',
        'Wrong shade number for welding intensity',
        'Neglecting side shields on spectacles',
        'Using direct-vent goggles for chemical splash',
        'Not replacing scratched lenses (reduced visibility)',
      ]),
      
      heading('h2', 'Next Steps'),
      paragraph([text('Browse our '), text('Safety & PPE', 1), text(' category for ANSI Z87.1-rated eyewear. Need help matching eyewear to your specific hazards? Use our '), text('AI Sourcing Assistant', 1), text(' or '), text('request a quote', 1), text(' for bulk orders.')]),
    ]),
    seo: {
      metaTitle: 'Safety Glasses Guide: ANSI Z87.1 Requirements Explained',
      metaDescription: 'Complete guide to ANSI Z87.1 safety eyewear. Understand Z87+ impact ratings, lens materials, tints, and coatings for your workplace.',
    },
  },
  
  {
    title: 'Fall Protection Basics: OSHA Requirements and Equipment Selection',
    slug: 'fall-protection-basics-osha-requirements',
    excerpt: 'Understand OSHA fall protection requirements for construction and general industry. Learn about height thresholds, equipment types (harnesses, lanyards, anchors, SRLs), and how to select the right system.',
    category: 'buying-guide',
    tags: ['safety', 'fall protection', 'PPE', 'OSHA', 'harness', 'construction'],
    author: 'Machrio Team',
    content: richTextDoc([
      paragraph([text('Falls are the leading cause of death in construction and a major hazard in general industry. This guide covers OSHA fall protection requirements and helps you select appropriate equipment.')]),
      
      heading('h2', 'OSHA Fall Protection Height Requirements'),
      
      heading('h3', 'Construction (29 CFR 1926.501)'),
      paragraph([text('Fall protection required at ', 0), text('6 feet', 1), text(' or more above a lower level. This applies to:')]),
      bulletList([
        'Walking/working surfaces with unprotected sides or edges',
        'Leading edges',
        'Holes (including skylights)',
        'Formwork and reinforcing steel',
        'Roofing work',
        'Wall openings',
        'Steep roofs (>4:12 pitch)',
      ]),
      
      heading('h3', 'General Industry (29 CFR 1910.28)'),
      paragraph([text('Fall protection required at ', 0), text('4 feet', 1), text(' for most walking-working surfaces, with specific exceptions:')]),
      bulletList([
        '4 feet — General walking-working surfaces',
        '6 feet — Scaffold erection/dismantling',
        '8 feet — Above dangerous equipment',
        'Vehicle manufacturers may use alternative measures at certain heights',
      ]),
      
      heading('h2', 'Fall Protection Systems'),
      
      heading('h3', 'Passive Systems (Preferred)'),
      paragraph([text('Eliminate the hazard without requiring worker action:')]),
      bulletList([
        'Guardrails — Top rail at 42" (+/- 3"), mid rail, toe board',
        'Safety nets — Positioned as close as practical below work',
        'Covers — Over holes, secured to prevent displacement',
      ]),
      
      heading('h3', 'Personal Fall Arrest Systems (PFAS)'),
      paragraph([text('Active protection when passive systems are not feasible:')]),
      
      paragraph([text('Full-Body Harness', 1), text(' — Required component. Distributes fall forces across thighs, pelvis, chest, and shoulders. Must meet ANSI Z359.1.')]),
      
      paragraph([text('Connecting Device', 1), text(' — Links harness to anchor:')]),
      bulletList([
        'Shock-absorbing lanyard — Limits fall arrest force to 1,800 lbs max',
        'Self-retracting lifeline (SRL) — Allows movement, locks on fall',
        'Rope grab — Allows vertical movement on lifeline',
      ]),
      
      paragraph([text('Anchor Point', 1), text(' — Must support 5,000 lbs per worker OR be designed by qualified person with 2:1 safety factor.')]),
      
      heading('h2', 'Harness Selection Criteria'),
      
      heading('h3', 'D-Ring Configuration'),
      bulletList([
        'Back D-ring — Fall arrest (required)',
        'Front D-ring — Climbing, retrieval',
        'Side D-rings — Work positioning, restraint',
        'Shoulder D-rings — Retrieval, confined space',
      ]),
      
      heading('h3', 'Harness Features'),
      bulletList([
        'Webbing material — Polyester (general), Kevlar (heat), Nomex (arc flash)',
        'Buckle type — Tongue buckle, pass-through, quick-connect',
        'Padding — Shoulder and leg pads for extended wear',
        'Tool loops — For workers carrying equipment',
        'Hi-vis — For visibility requirements',
      ]),
      
      heading('h2', 'Self-Retracting Lifeline (SRL) Selection'),
      
      heading('h3', 'Length'),
      bulletList([
        '6-11 feet — Close work to anchor',
        '20-30 feet — General construction',
        '50+ feet — Tower work, high structures',
      ]),
      
      heading('h3', 'Cable vs. Webbing'),
      bulletList([
        'Galvanized cable — Durable, edge-resistant, industrial',
        'Stainless cable — Corrosion-resistant, clean environments',
        'Webbing — Lighter, no sharp edges, general use',
      ]),
      
      heading('h3', 'Features'),
      bulletList([
        'Leading edge rated — For work where line contacts edge',
        'Integral rescue — Built-in retrieval capability',
        'Twin-leg — For 100% tie-off requirements',
        'Personal SRL — Attached directly to harness D-ring',
      ]),
      
      heading('h2', 'Fall Clearance Calculation'),
      paragraph([text('Before using a PFAS, calculate required clearance below the work level:')]),
      paragraph([text('Clearance = Free fall distance + Deceleration distance + Harness stretch + D-ring height + Safety margin')]),
      
      heading('h3', 'Example: 6-foot shock-absorbing lanyard'),
      bulletList([
        'Free fall: 6 feet (lanyard length)',
        'Shock absorber deployment: 3.5 feet',
        'Harness stretch: 1 foot',
        'D-ring slide: 1 foot',
        'Safety margin: 3 feet',
        'Total clearance needed: 14.5 feet',
      ]),
      
      paragraph([text('If clearance is limited, use a shorter lanyard, SRL, or alternative system.')]),
      
      heading('h2', 'Inspection and Maintenance'),
      
      heading('h3', 'Before Each Use'),
      bulletList([
        'Check webbing for cuts, burns, abrasion, chemical damage',
        'Inspect hardware for cracks, corrosion, deformation',
        'Verify labels are legible',
        'Test buckles and D-rings for proper operation',
      ]),
      
      heading('h3', 'Retirement Criteria'),
      bulletList([
        'After any fall arrest event — equipment must be removed from service',
        'Manufacturer-specified service life (typically 5-7 years)',
        'Signs of UV degradation, chemical exposure, heat damage',
        'Failed inspection — do not attempt repair',
      ]),
      
      heading('h2', 'Training Requirements'),
      paragraph([text('OSHA requires workers using fall protection to be trained on:')]),
      bulletList([
        'Fall hazard recognition',
        'Proper equipment use, inspection, and storage',
        'Equipment limitations',
        'Rescue procedures',
        'Retraining when deficiencies observed or equipment changes',
      ]),
      
      heading('h2', 'Common Mistakes to Avoid'),
      bulletList([
        'Tying off to weak anchors (conduit, railings not rated)',
        'Using worn or damaged equipment',
        'Insufficient fall clearance calculation',
        'Improper harness fit (loose straps, wrong size)',
        'Not having a rescue plan',
        'Using equipment past manufacturer service life',
      ]),
      
      heading('h2', 'Next Steps'),
      paragraph([text('Browse our '), text('Safety & PPE', 1), text(' category for ANSI Z359.1-rated harnesses, lanyards, and SRLs. For help designing a fall protection system for your site, '), text('request a quote', 1), text(' with your application details and our team will recommend appropriate equipment.')]),
    ]),
    seo: {
      metaTitle: 'Fall Protection Guide: OSHA Requirements & Equipment',
      metaDescription: 'OSHA fall protection requirements for construction and general industry. Learn about harnesses, lanyards, SRLs, anchors, and clearance calculations.',
    },
  },
]

// ---------------------------------------------------------------------------
// Seed Function
// ---------------------------------------------------------------------------

async function seedArticles() {
  console.log('Starting article seed...')

  const payload = await getPayload({ config })

  for (const article of articles) {
    try {
      // Check if article already exists
      const existing = await payload.find({
        collection: 'articles',
        where: { slug: { equals: article.slug } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`Article already exists: ${article.slug}, updating...`)
        await payload.update({
          collection: 'articles',
          where: { slug: { equals: article.slug } },
          data: {
            ...article,
            status: 'published',
            publishedAt: new Date().toISOString(),
          },
        })
      } else {
        console.log(`Creating article: ${article.slug}`)
        await payload.create({
          collection: 'articles',
          data: {
            ...article,
            status: 'published',
            publishedAt: new Date().toISOString(),
          },
        })
      }
    } catch (error) {
      console.error(`Error creating article ${article.slug}:`, error)
    }
  }

  console.log('Article seed complete!')
  process.exit(0)
}

seedArticles()
