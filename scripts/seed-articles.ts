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

  // ── Respirator Types FAQ Article ──
  {
    title: 'Are All Types of Respirators the Same? Understanding Respirator Categories',
    slug: 'are-all-types-of-respirators-the-same',
    excerpt: 'No, respirators vary significantly by protection type, filter class, and intended hazards. Learn the differences between N95s, half-face, full-face, PAPRs, and supplied-air respirators to choose the right protection.',
    category: 'buying-guide',
    tags: ['safety', 'respirators', 'PPE', 'NIOSH', 'respiratory protection'],
    author: 'Machrio Team',
    quickAnswer: 'No. Respirators range from disposable N95s for dust, to reusable half/full-face with cartridges, to PAPRs and supplied-air systems. Selection depends on hazard type, required protection factor, and OSHA/NIOSH requirements.',
    faq: [
      {
        question: 'Are all types of respirators the same?',
        answer: 'No. Respirators differ by protection mechanism (air-purifying vs. atmosphere-supplying), form factor (disposable vs. reusable, half-face vs. full-face), filter type (N/R/P series, organic vapor, acid gas), and assigned protection factor (APF 10 to 10,000+). Choosing the wrong type can result in inadequate protection or OSHA violations.'
      },
      {
        question: 'What is the difference between N95 and P100 respirators?',
        answer: 'N95 filters 95% of airborne particles and is not oil-resistant. P100 filters 99.97% of particles and is oil-proof. N95 is sufficient for dust, pollen, and most airborne pathogens. P100 is required for oil-based aerosols, lead, asbestos, and environments requiring higher protection factors.'
      },
      {
        question: 'When should I use a full-face respirator instead of a half-face?',
        answer: 'Use full-face respirators when: (1) eye protection is needed against the same hazard, (2) higher protection factor is required (APF 50 vs APF 10), (3) working with chemicals that irritate eyes, or (4) regulations specify full-face for the contaminant (e.g., certain pesticides, emergency response).'
      },
      {
        question: 'What is a PAPR and when is it needed?',
        answer: 'A Powered Air-Purifying Respirator (PAPR) uses a battery-powered blower to push filtered air into a hood or facepiece. PAPRs are needed when: higher protection factors are required (APF 25-1000), workers cannot achieve fit with tight-fitting respirators, extended wear is needed, or workers have facial hair that prevents mask seal.'
      },
      {
        question: 'How do I know which respirator OSHA requires for my workplace?',
        answer: 'OSHA requires employers to: (1) identify respiratory hazards through exposure assessment, (2) select NIOSH-certified respirators with adequate protection factors, (3) implement a written respiratory protection program per 29 CFR 1910.134, (4) conduct fit testing for tight-fitting respirators, and (5) provide training. Consult OSHA permissible exposure limits (PELs) for specific contaminants.'
      }
    ],
    content: richTextDoc([
      // Short intro paragraphs
      paragraph([text('Respirators are not all the same.')]),
      paragraph([text('Choosing the wrong type can leave workers exposed to serious hazards.')]),
      paragraph([text('This guide covers the key differences to help you pick the right protection.')]),
      
      heading('h2', 'Two Main Classes: Air-Purifying vs. Atmosphere-Supplying'),
      
      heading('h3', 'Air-Purifying Respirators (APRs)'),
      paragraph([text('APRs filter contaminants from the ambient air.')]),
      paragraph([text('They require at least 19.5% oxygen to function safely.')]),
      paragraph([text('Contaminant levels must be below IDLH (Immediately Dangerous to Life or Health) thresholds.')]),
      paragraph([text('Common APR types include:')]),
      bulletList([
        'Filtering Facepiece Respirators (FFRs): Disposable N95, N99, P100 masks',
        'Elastomeric Half-Face: Reusable with replaceable cartridges',
        'Elastomeric Full-Face: Higher protection plus eye coverage',
        'PAPRs: Battery-powered filtered air supply',
      ]),
      
      heading('h3', 'Atmosphere-Supplying Respirators'),
      paragraph([text('These deliver clean air from an independent source.')]),
      paragraph([text('Use them when oxygen is low, IDLH conditions exist, or contaminant levels are unknown.')]),
      bulletList([
        'Supplied-Air Respirators (SARs): Air line to remote source',
        'Self-Contained Breathing Apparatus (SCBA): Portable tank (firefighter style)',
        'Combination units: SAR with escape SCBA bottle',
      ]),
      
      heading('h2', 'NIOSH Filter Classifications'),
      paragraph([text('NIOSH rates particulate filters with a letter-number code.')]),
      
      heading('h3', 'Letter: Oil Resistance'),
      paragraph([text('The letter indicates how the filter handles oil aerosols:')]),
      bulletList([
        'N (Not oil-resistant): Non-oil particles only',
        'R (oil-Resistant): Limited oil exposure, single shift max',
        'P (oil-Proof): Extended use with oil-containing atmospheres',
      ]),
      
      heading('h3', 'Number: Filtration Efficiency'),
      paragraph([text('The number shows minimum filtration percentage:')]),
      bulletList([
        '95: Filters ≥95% of airborne particles',
        '99: Filters ≥99% of airborne particles',
        '100: Filters ≥99.97% (HEPA equivalent)',
      ]),
      paragraph([text('Example: P100 means oil-proof with 99.97% filtration.')]),
      paragraph([text('P100 is required for lead, asbestos, and many toxic dusts.')]),
      
      heading('h2', 'Gas and Vapor Cartridges'),
      paragraph([text('Chemical cartridges are color-coded by hazard:')]),
      bulletList([
        'Black: Organic vapors (solvents, paints)',
        'White: Acid gases (chlorine, HCl)',
        'Yellow: Organic vapors + acid gases',
        'Green: Ammonia',
        'Olive: Multi-gas/vapor',
        'Orange: Mercury vapor',
        'Purple: HEPA/P100 particulate',
        'Magenta: Particulate (N/R/P series)',
      ]),
      paragraph([text('Always match the cartridge color to your specific hazard.')]),
      
      heading('h2', 'Assigned Protection Factors (APF)'),
      paragraph([text('OSHA assigns APF values showing exposure reduction:')]),
      bulletList([
        'APF 10: Half-face APRs, N95s (reduces exposure to 1/10)',
        'APF 25: PAPRs with loose-fitting hood',
        'APF 50: Full-face APRs, tight-fitting PAPRs',
        'APF 1000: SAR full facepiece, PAPR helmet/hood',
        'APF 10,000: SCBA full facepiece (pressure-demand)',
      ]),
      paragraph([text('Pick a respirator with APF high enough to stay below the OEL.')]),
      
      heading('h2', 'How to Choose the Right Respirator'),
      
      heading('h3', 'Step 1: Identify the Hazard'),
      paragraph([text('Ask these questions first:')]),
      bulletList([
        'What contaminants? (particles, gases, vapors, or mix)',
        'What are measured exposure levels?',
        'Is oxygen below 19.5% or atmosphere IDLH?',
      ]),
      
      heading('h3', 'Step 2: Calculate Required Protection'),
      paragraph([text('Divide workplace concentration by OEL to find minimum APF.')]),
      paragraph([text('Select a respirator type that meets or exceeds this APF.')]),
      paragraph([text('Choose the correct filter or cartridge for your contaminant.')]),
      
      heading('h3', 'Step 3: Consider Practical Factors'),
      paragraph([text('Protection alone is not enough. Consider:')]),
      bulletList([
        'Wear duration — comfort matters for long shifts',
        'Communication — some designs allow clearer speech',
        'Facial hair — may require PAPR or loose-fitting design',
        'Glasses — full-face needs prescription inserts',
        'Heat stress — PAPRs reduce breathing effort',
      ]),
      
      heading('h2', 'Common Applications by Type'),
      
      heading('h3', 'N95 Disposable'),
      paragraph([text('Best for low-hazard particulate environments:')]),
      bulletList([
        'Construction dust and drywall',
        'Healthcare airborne precautions',
        'Wildfire smoke',
        'General nuisance dust',
      ]),
      
      heading('h3', 'Half-Face with Cartridges'),
      paragraph([text('Versatile for chemical and particulate hazards:')]),
      bulletList([
        'Paint spraying (OV cartridges)',
        'Pesticide application',
        'Solvent work',
        'Welding fumes (P100 filter)',
      ]),
      
      heading('h3', 'Full-Face Respirator'),
      paragraph([text('Higher protection plus eye coverage:')]),
      bulletList([
        'Asbestos abatement',
        'Lead paint removal',
        'Chemical splash hazards',
        'Silica in construction',
      ]),
      
      heading('h3', 'PAPR'),
      paragraph([text('Powered systems for special needs:')]),
      bulletList([
        'Healthcare isolation (COVID, TB)',
        'Pharmaceutical manufacturing',
        'Workers who fail fit tests',
        'Extended high-hazard work',
      ]),
      
      heading('h3', 'Supplied-Air / SCBA'),
      paragraph([text('Maximum protection for extreme environments:')]),
      bulletList([
        'Confined space entry',
        'Emergency response',
        'Sandblasting',
        'Chemical spill cleanup',
      ]),
      
      heading('h2', 'OSHA Requirements'),
      paragraph([text('When respirators are required, OSHA 29 CFR 1910.134 mandates:')]),
      bulletList([
        'Written respiratory protection program',
        'Medical evaluation before fit testing',
        'Annual fit tests for tight-fitting respirators',
        'Training on use, limits, and maintenance',
        'Proper storage and maintenance',
        'Program evaluation and records',
      ]),
      
      heading('h2', 'Key Takeaways'),
      paragraph([text('Remember these critical points:')]),
      bulletList([
        'Respirators vary enormously — no single type fits all hazards',
        'Match APF to your calculated exposure',
        'APRs need adequate oxygen and sub-IDLH levels',
        'Cartridges are hazard-specific — check color codes',
        'Fit testing is mandatory for tight-fitting types',
        'When uncertain, consult NIOSH or a safety professional',
      ]),
      
      heading('h2', 'Next Steps'),
      paragraph([text('Browse our '), text('Respiratory Protection', 1), text(' category for NIOSH-certified options.')]),
      paragraph([text('Need help choosing? Use our '), text('AI Sourcing Assistant', 1), text(' or '), text('request a quote', 1), text(' with your exposure data.')]),
    ]),
    seo: {
      metaTitle: 'Are All Respirators the Same? Types & Selection Guide',
      metaDescription: 'Respirators differ by type (N95, half-face, PAPR, SCBA), filter class, and protection factor. Learn to choose the right respiratory PPE.',
    },
  },
  // ── Respirator Selection Buying Guide ──
  {
    title: 'How to Choose the Right Respirator for Your Job',
    slug: 'how-to-choose-respirator-for-your-job',
    excerpt: 'A step-by-step guide to selecting the right respirator based on your workplace hazards, exposure levels, and OSHA requirements. Covers N95, half-face, full-face, PAPR, and supplied-air systems.',
    category: 'buying-guide',
    tags: ['safety', 'respirators', 'PPE', 'NIOSH', 'respiratory protection', 'buying guide'],
    author: 'Machrio Team',
    quickAnswer: 'Identify your hazard type, measure exposure levels, calculate the required APF, then select a NIOSH-certified respirator that meets or exceeds it. N95s suit low-hazard dust; half-face handles chemical vapors; full-face adds eye protection; PAPRs serve extended wear; SCBA covers IDLH environments.',
    faq: [
      {
        question: 'How do I choose the right respirator for my job?',
        answer: 'Start by identifying the hazard (particles, gases, vapors, or oxygen deficiency). Measure workplace exposure levels. Calculate the minimum Assigned Protection Factor (APF) by dividing concentration by the Occupational Exposure Limit. Then select a NIOSH-certified respirator whose APF meets or exceeds that number. Finally, ensure proper fit testing per OSHA 29 CFR 1910.134.',
      },
      {
        question: 'What factors affect respirator selection?',
        answer: 'Key factors include: hazard type and concentration, required protection factor, oxygen levels, duration of wear, facial hair, prescription glasses, heat stress, communication needs, and OSHA regulatory requirements for your industry.',
      },
      {
        question: 'When is a disposable N95 not enough?',
        answer: 'An N95 is insufficient when: contaminant levels exceed 10x the OEL (APF 10 limit), oil-based aerosols are present, gas or vapor hazards exist, oxygen is below 19.5%, the atmosphere is IDLH, or eye protection against the same contaminant is needed.',
      },
      {
        question: 'Do I need a full-face respirator or a half-face?',
        answer: 'Use a full-face when you need APF 50 (vs APF 10 for half-face), when the contaminant irritates eyes, when regulations specify full-face for the hazard (e.g., certain pesticides, asbestos), or when combined eye and respiratory protection is more practical than separate equipment.',
      },
      {
        question: 'What respirator do I need for painting and spray work?',
        answer: 'For spray painting: use at minimum a half-face respirator with organic vapor (OV) cartridges plus P95 or P100 particulate pre-filters. For isocyanate-based paints (automotive clear coats), a supplied-air respirator is required. Always check the Safety Data Sheet for specific contaminants.',
      },
      {
        question: 'How do I select respirator cartridges?',
        answer: 'Match cartridge color to hazard: black for organic vapors, white for acid gases, yellow for OV + acid gas combo, green for ammonia, olive for multi-gas, purple/magenta for particulate. Always verify against the specific chemical on your Safety Data Sheet. Combination cartridges (e.g., OV/P100) cover multiple hazards simultaneously.',
      },
    ],
    content: richTextDoc([
      // Quick answer intro
      paragraph([text('Choosing the wrong respirator can be just as dangerous as wearing none at all.')]),
      paragraph([text('The right choice depends on three things: what you are breathing, how much of it, and how long you are exposed.')]),
      paragraph([text('This guide walks you through the selection process step by step.')]),

      heading('h2', 'Quick Decision Flowchart'),
      paragraph([text('Use this logic to narrow your options fast:')]),
      paragraph([text('1. Is oxygen below 19.5% or the atmosphere IDLH?')]),
      paragraph([text('→ Yes: You need supplied-air (SAR or SCBA). Stop here.')]),
      paragraph([text('→ No: Continue to step 2.')]),
      paragraph([text('2. Is the hazard a gas, vapor, or combination?')]),
      paragraph([text('→ Gas/vapor only: Half-face or full-face with chemical cartridges.')]),
      paragraph([text('→ Particulate only: N95, P100, or elastomeric with particulate filter.')]),
      paragraph([text('→ Combination: Use combo cartridges (e.g., OV/P100).')]),
      paragraph([text('3. Calculate your required APF.')]),
      paragraph([text('→ APF ≤ 10: Half-face or N95 disposable.')]),
      paragraph([text('→ APF 11–50: Full-face or tight-fitting PAPR.')]),
      paragraph([text('→ APF > 50: Supplied-air or SCBA.')]),
      paragraph([text('4. Do you need eye protection from the same hazard?')]),
      paragraph([text('→ Yes: Full-face, PAPR with hood, or supplied-air.')]),
      paragraph([text('→ No: Half-face is acceptable if APF allows.')]),

      heading('h2', 'Respirator Types at a Glance'),
      paragraph([text('Each type serves a different protection range and use case.')]),

      heading('h3', 'Disposable Filtering Facepiece (N95, P100)'),
      paragraph([text('APF: 10.')]),
      paragraph([text('Best for: Low-concentration particulate hazards like construction dust, drywall, healthcare airborne precautions, and wildfire smoke.')]),
      paragraph([text('Limitations: No gas/vapor protection. Not oil-resistant (N series). Cannot be fit-tested with facial hair. Single use.')]),

      heading('h3', 'Elastomeric Half-Face Respirator'),
      paragraph([text('APF: 10.')]),
      paragraph([text('Best for: Recurring chemical or particulate exposures where reusable equipment is cost-effective. Paint spraying, pesticide application, solvent work, welding fumes.')]),
      paragraph([text('Advantages over disposables: Replaceable cartridges, better seal, more comfortable for repeated use, lower long-term cost.')]),

      heading('h3', 'Elastomeric Full-Face Respirator'),
      paragraph([text('APF: 50.')]),
      paragraph([text('Best for: Higher-concentration hazards requiring eye protection. Asbestos abatement, lead paint removal, chemical splash environments, silica exposure.')]),
      paragraph([text('Key benefit: Five times the protection factor of a half-face, plus integrated eye and face coverage.')]),

      heading('h3', 'Powered Air-Purifying Respirator (PAPR)'),
      paragraph([text('APF: 25 (loose-fitting) to 1,000 (helmet/hood).')]),
      paragraph([text('Best for: Extended wear, workers with facial hair, workers who fail fit tests, pharmaceutical and healthcare isolation.')]),
      paragraph([text('Key benefit: Battery-powered fan reduces breathing effort. Loose-fitting options eliminate fit testing.')]),

      heading('h3', 'Supplied-Air Respirator (SAR)'),
      paragraph([text('APF: 50 (half-face) to 1,000 (full facepiece, pressure-demand).')]),
      paragraph([text('Best for: IDLH environments, oxygen-deficient spaces, sandblasting, spray painting with isocyanates.')]),
      paragraph([text('Limitation: Tethered to airline. Limited mobility.')]),

      heading('h3', 'Self-Contained Breathing Apparatus (SCBA)'),
      paragraph([text('APF: 10,000 (pressure-demand full facepiece).')]),
      paragraph([text('Best for: Emergency response, firefighting, confined space rescue, chemical spill entry.')]),
      paragraph([text('Limitation: Heavy. Limited air supply duration (30–60 minutes typical).')]),

      heading('h2', 'Step 1: Identify Your Hazard'),
      paragraph([text('Start with your Safety Data Sheet (SDS).')]),
      paragraph([text('It tells you the contaminant name, OEL, and recommended PPE.')]),

      heading('h3', 'Hazard Categories'),
      paragraph([text('Particulates: Dust, fumes, mist, fibers (e.g., silica, welding fume, asbestos).')]),
      paragraph([text('Gases and vapors: Chemical vapors (e.g., solvents, ammonia, chlorine).')]),
      paragraph([text('Combination: Both particulate and gas/vapor present simultaneously.')]),
      paragraph([text('Oxygen deficiency: Below 19.5% O₂ — requires atmosphere-supplying respirator.')]),

      heading('h2', 'Step 2: Calculate Required Protection Factor'),
      paragraph([text('This is the most important number in respirator selection.')]),
      paragraph([text('Formula: Required APF = Workplace Concentration ÷ OEL.')]),
      paragraph([text('Example: Silica dust at 2.5 mg/m³ with OEL of 0.05 mg/m³.')]),
      paragraph([text('Required APF = 2.5 ÷ 0.05 = 50.')]),
      paragraph([text('You need at least a full-face respirator (APF 50) for this exposure.')]),

      heading('h3', 'APF Quick Reference'),
      bulletList([
        'APF 10 → N95, half-face APR',
        'APF 25 → PAPR with loose-fitting hood',
        'APF 50 → Full-face APR, tight-fitting PAPR',
        'APF 1,000 → SAR full facepiece (pressure-demand), PAPR helmet/hood',
        'APF 10,000 → SCBA full facepiece (pressure-demand)',
      ]),

      heading('h2', 'Step 3: Choose Filters or Cartridges'),

      heading('h3', 'For Particulates'),
      paragraph([text('NIOSH uses a letter + number code:')]),
      bulletList([
        'N95: 95% filtration, not oil-resistant — most common',
        'R95: 95% filtration, oil-resistant for one shift',
        'P100: 99.97% filtration, oil-proof — required for lead, asbestos',
      ]),
      paragraph([text('When in doubt between N95 and P100, choose P100.')]),
      paragraph([text('The cost difference is small. The protection difference is significant.')]),

      heading('h3', 'For Gases and Vapors'),
      paragraph([text('Cartridges are color-coded by hazard:')]),
      bulletList([
        'Black — Organic vapors (paints, solvents, adhesives)',
        'White — Acid gases (chlorine, hydrogen chloride, SO₂)',
        'Yellow — Organic vapors + acid gases combined',
        'Green — Ammonia and methylamine',
        'Olive — Multi-gas/vapor',
        'Orange — Mercury vapor',
      ]),
      paragraph([text('For mixed hazards, use combination cartridges.')]),
      paragraph([text('Example: OV/P100 covers organic vapors plus particulates simultaneously.')]),

      heading('h2', 'Step 4: Consider Practical Factors'),
      paragraph([text('The best respirator on paper is useless if workers refuse to wear it.')]),

      heading('h3', 'Comfort and Duration'),
      paragraph([text('For shifts over 2 hours, consider elastomeric or PAPR over disposables.')]),
      paragraph([text('PAPRs reduce breathing resistance, which matters in heat or physical labor.')]),

      heading('h3', 'Facial Hair'),
      paragraph([text('Tight-fitting respirators (N95, half-face, full-face) require a clean shave.')]),
      paragraph([text('Workers with beards need loose-fitting PAPRs or supplied-air hoods.')]),

      heading('h3', 'Prescription Glasses'),
      paragraph([text('Standard glasses break the seal on full-face respirators.')]),
      paragraph([text('Use manufacturer prescription inserts or PAPR hoods instead.')]),

      heading('h3', 'Communication'),
      paragraph([text('Half-face designs muffle speech less than full-face.')]),
      paragraph([text('Some full-face models have speaking diaphragms or radio integration.')]),

      heading('h3', 'Cost'),
      paragraph([text('Disposable N95: $1–3 per mask, no maintenance.')]),
      paragraph([text('Reusable half-face: $25–40 facepiece + $5–15 per cartridge pair.')]),
      paragraph([text('Full-face: $100–300 facepiece.')]),
      paragraph([text('PAPR: $800–2,500 complete system.')]),
      paragraph([text('For daily use, reusable options pay for themselves within weeks.')]),

      heading('h2', 'Common Selection Mistakes'),
      paragraph([text('These errors show up repeatedly in workplace safety audits:')]),
      bulletList([
        'Using N95 for chemical vapors — N95 filters particles only, not gases',
        'Ignoring oil aerosols — N-series filters degrade in oil mist',
        'Wrong cartridge for the chemical — always check the SDS',
        'Skipping APF calculation — guessing leads to under-protection',
        'Using tight-fitting respirator with facial hair — seal fails completely',
        'Never replacing cartridges — breakthrough occurs without warning for most chemicals',
        'Skipping fit testing — required annually per OSHA for tight-fitting types',
      ]),

      heading('h2', 'Industry-Specific Recommendations'),

      heading('h3', 'Construction'),
      paragraph([text('Primary hazards: Silica, concrete dust, lead paint, asbestos.')]),
      paragraph([text('Minimum: N95 for general dust. P100 half-face for silica. Full-face for asbestos/lead.')]),

      heading('h3', 'Auto Body and Painting'),
      paragraph([text('Primary hazards: Organic vapors, isocyanates, particulate overspray.')]),
      paragraph([text('Minimum: OV/P95 half-face for waterborne paint. Supplied-air for isocyanate clear coats.')]),

      heading('h3', 'Welding'),
      paragraph([text('Primary hazards: Metal fumes, ozone, hexavalent chromium (stainless steel).')]),
      paragraph([text('Minimum: P100 half-face. PAPR for stainless/hex chrome. Supplied-air for confined welding.')]),

      heading('h3', 'Healthcare'),
      paragraph([text('Primary hazards: Airborne pathogens (TB, COVID, influenza).')]),
      paragraph([text('Minimum: N95 for standard airborne precautions. PAPR for aerosol-generating procedures.')]),

      heading('h3', 'Manufacturing and Chemical'),
      paragraph([text('Primary hazards: Varies — solvents, acids, particulates, process gases.')]),
      paragraph([text('Approach: SDS-driven. Match cartridge type and APF to measured exposure for each operation.')]),

      heading('h2', 'OSHA Compliance Checklist'),
      paragraph([text('When respirators are required, OSHA 29 CFR 1910.134 mandates:')]),
      bulletList([
        'Written respiratory protection program with site-specific procedures',
        'Hazard assessment and exposure monitoring',
        'Medical evaluation (questionnaire or exam) before fit testing',
        'Annual fit testing for every tight-fitting respirator user',
        'Training on use, limitations, maintenance, and emergency procedures',
        'Proper cleaning, storage, and inspection protocols',
        'Program evaluation at least annually',
      ]),
      paragraph([text('Voluntary N95 use still requires Appendix D training.')]),
      paragraph([text('Document everything. OSHA inspectors ask for records first.')]),

      heading('h2', 'Key Takeaways'),
      bulletList([
        'Always start with hazard identification and APF calculation',
        'Match filter/cartridge type to your specific contaminant',
        'N95 covers only low-level particulates — not gases or vapors',
        'Full-face gives 5x the protection of half-face (APF 50 vs 10)',
        'PAPRs solve facial hair, glasses, and comfort problems',
        'Supplied-air is mandatory for IDLH and oxygen-deficient spaces',
        'Fit testing is not optional — it is an annual OSHA requirement',
      ]),

      heading('h2', 'Next Steps'),
      paragraph([text('Browse our '), text('Respiratory Protection', 1), text(' catalog for NIOSH-certified respirators.')]),
      paragraph([text('Not sure which type fits your situation? Use our '), text('AI Sourcing Assistant', 1), text(' — describe your workplace hazard and get a recommendation.')]),
      paragraph([text('For bulk orders or custom kitting, '), text('request a quote', 1), text(' with your exposure data and team size.')]),
    ]),
    seo: {
      metaTitle: 'How to Choose the Right Respirator for Your Job',
      metaDescription: 'Step-by-step respirator selection guide. Match N95, half-face, full-face, PAPR, or supplied-air to your workplace hazard, exposure level, and OSHA requirements.',
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
            _status: 'published',
            publishedAt: new Date().toISOString(),
          },
          draft: false,
        })
      } else {
        console.log(`Creating article: ${article.slug}`)
        await payload.create({
          collection: 'articles',
          data: {
            ...article,
            status: 'published',
            _status: 'published',
            publishedAt: new Date().toISOString(),
          },
          draft: false,
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
