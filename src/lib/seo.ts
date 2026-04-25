export interface SeoFaq {
  question: string
  answer: string
}

export interface SeoGuideLink {
  slug: string
  title: string
  excerpt: string
}

export interface SeoCategoryLink {
  slug: string
  name: string
  description: string
}

export interface SeoPageRoadmapItem {
  slug: string
  name: string
  priority: 'high' | 'medium' | 'low'
  status: 'implemented' | 'ready' | 'pending-content' | 'pending-availability'
  owner: string
  rationale: string
}

export const SEO_CATEGORY_ROADMAP: SeoPageRoadmapItem[] = [
  {
    slug: 'haz-loc',
    name: 'HazLoc Isolation Hardware',
    priority: 'high',
    status: 'ready',
    owner: 'SEO',
    rationale: 'High-intent industrial safety flow from lockout and electrical isolation pages; currently covered by dedicated copy in seo.ts.',
  },
  {
    slug: 'explosion-proof-limit-switch',
    name: 'Explosion-Proof Limit Switches',
    priority: 'high',
    status: 'ready',
    owner: 'SEO',
    rationale: 'Critical electrical/plant maintenance intent with certification and downtime sensitivity.',
  },
  {
    slug: 'terminal-bridge-connectors',
    name: 'Terminal Bridge Connectors',
    priority: 'medium',
    status: 'ready',
    owner: 'SEO',
    rationale: 'Connector compatibility checks are frequent in lockout and panel workflows and should move from generic catalog browsing to fit-driven landing copy.',
  },
  {
    slug: 'rf-coax-connectors',
    name: 'RF/Coax Connectors',
    priority: 'medium',
    status: 'ready',
    owner: 'SEO',
    rationale: 'High support load from signal-chain mismatch risk; copy now includes feasibility-first checks before checkout or RFQ routing.',
  },
  {
    slug: 'cleanroom-bucket',
    name: 'Cleanroom Buckets',
    priority: 'medium',
    status: 'ready',
    owner: 'SEO',
    rationale: 'Crosses janitorial and facility workflows with compliance-style buying behavior; moved to dedicated intent copy.',
  },
  {
    slug: 'flooring',
    name: 'Flooring Materials',
    priority: 'low',
    status: 'ready',
    owner: 'SEO',
    rationale: 'Needs full cluster expansion in final page structure later, currently seeded with decision-oriented SEO skeleton.',
  },
  {
    slug: 'epdm',
    name: 'EPDM Materials',
    priority: 'low',
    status: 'ready',
    owner: 'SEO',
    rationale: 'Spec-heavy commodity where stock and custom profile path should be split for quote routing.',
  },
  {
    slug: 'engineered-wood-flooring',
    name: 'Engineered Wood Flooring',
    priority: 'low',
    status: 'ready',
    owner: 'SEO',
    rationale: 'Needs stronger category-level page structure; current copy now aligns to spec-and-installation decision path.',
  },
]

export interface SeoCategoryOverride {
  metaTitle: string
  metaDescription: string
  summary: string
  buyingFactors: string[]
  applications: string[]
  procurementChecklist: string[]
  faq: SeoFaq[]
  guideSlugs?: string[]
  priorityLinksHeading?: string
  priorityLinksDescription?: string
  priorityLinks?: SeoCategoryLink[]
}

export interface ProductCategoryContext {
  slug: string
  name: string
}

const GUIDE_LIBRARY: Record<string, SeoGuideLink> = {
  'how-to-choose-lockout-tagout-kits-buying-guide': {
    slug: 'how-to-choose-lockout-tagout-kits-buying-guide',
    title: 'How to Choose Lockout & Tagout Kits',
    excerpt: 'Match lockout kits to your energy sources, crew size, lock ownership model, and OSHA 1910.147 workflow.',
  },
  'how-to-choose-respiratory-protection-buying-guide': {
    slug: 'how-to-choose-respiratory-protection-buying-guide',
    title: 'How to Choose Respiratory Protection',
    excerpt: 'Compare respirator types, filters, fit, service environment, and compliance requirements before buying.',
  },
  'how-to-choose-respirator-for-your-job': {
    slug: 'how-to-choose-respirator-for-your-job',
    title: 'How to Choose the Right Respirator for Your Job',
    excerpt: 'Use hazard type, APF, cartridge selection, comfort, and PPE compatibility to narrow the right respirator.',
  },
  'are-all-types-of-respirators-the-same': {
    slug: 'are-all-types-of-respirators-the-same',
    title: 'Are All Types of Respirators the Same?',
    excerpt: 'See when N95s, half-face, full-face, PAPR, and supplied-air respirators are actually interchangeable and when they are not.',
  },
  'air-respirator-buying-guide': {
    slug: 'air-respirator-buying-guide',
    title: 'Air Respirator Buying Guide',
    excerpt: 'Review the 10 most important fit, filter, comfort, and compliance checks before purchasing air respirators.',
  },
  'how-to-choose-hot-melt-adhesives-for-packaging-assembly-and-rework': {
    slug: 'how-to-choose-hot-melt-adhesives-for-packaging-assembly-and-rework',
    title: 'How to Choose Hot Melt Adhesives',
    excerpt: 'Use substrate, open time, temperature, viscosity, and line speed to compare hot melt adhesives before buying.',
  },
  'how-to-buy-plastic-perforated-sheets-for-guards-panels-and-fabrication': {
    slug: 'how-to-buy-plastic-perforated-sheets-for-guards-panels-and-fabrication',
    title: 'How to Buy Plastic Perforated Sheets',
    excerpt: 'Compare resin, thickness, hole pattern, open area, and fabrication needs before sourcing perforated sheets.',
  },
  'how-to-specify-shaft-grounding-rings-for-vfd-motors': {
    slug: 'how-to-specify-shaft-grounding-rings-for-vfd-motors',
    title: 'How to Specify Shaft Grounding Rings',
    excerpt: 'Match shaft grounding rings to shaft diameter, motor frame, environment, and retrofit constraints on VFD-driven equipment.',
  },
  'how-to-choose-oil-seals-for-rotating-equipment': {
    slug: 'how-to-choose-oil-seals-for-rotating-equipment',
    title: 'How to Choose Oil Seals',
    excerpt: 'Use shaft size, lip design, elastomer, temperature, and contamination exposure to compare industrial oil seals.',
  },
}

const CATEGORY_GUIDES: Record<string, string[]> = {
  'lockout-tagout': ['how-to-choose-lockout-tagout-kits-buying-guide'],
  'lockout-padlocks': ['how-to-choose-lockout-tagout-kits-buying-guide'],
  'valve-lockout-devices': ['how-to-choose-lockout-tagout-kits-buying-guide'],
  'electrical-lockout-devices': ['how-to-choose-lockout-tagout-kits-buying-guide'],
  'respiratory-protection': [
    'how-to-choose-respiratory-protection-buying-guide',
    'how-to-choose-respirator-for-your-job',
  ],
  'respirator-fit-testing': [
    'how-to-choose-respiratory-protection-buying-guide',
    'are-all-types-of-respirators-the-same',
  ],
  'hot-melt-adhesives': ['how-to-choose-hot-melt-adhesives-for-packaging-assembly-and-rework'],
  'plastic-perforated-sheets': ['how-to-buy-plastic-perforated-sheets-for-guards-panels-and-fabrication'],
  'shaft-grounding-rings': ['how-to-specify-shaft-grounding-rings-for-vfd-motors'],
  'plain-bearings': ['how-to-choose-oil-seals-for-rotating-equipment'],
}

const CATEGORY_OVERRIDES: Record<string, SeoCategoryOverride> = {
  'hot-melt-adhesives': {
    metaTitle: 'Hot Melt Adhesives for Packaging, Assembly & Maintenance',
    metaDescription:
      'Source hot melt adhesives by chemistry, application temperature, open time, stick diameter, and substrate compatibility for packaging and industrial assembly.',
    summary:
      'Hot melt adhesives are usually purchased on process fit, not on headline price. For Machrio, the page needs to help buyers compare adhesive chemistry, application method, set speed, bead control, and substrate compatibility so they can move from a broad search to a shortlist that actually works on the line.',
    buyingFactors: [
      'Choose adhesive chemistry and service temperature based on the actual substrate pair, not only the glue gun already on site.',
      'Confirm stick diameter, viscosity, and open time so the adhesive matches your gun, operator speed, and bead size requirement.',
      'Check whether packaging, woodworking, maintenance bonding, or light assembly needs higher heat resistance or cleaner release.',
    ],
    applications: [
      'Carton sealing, retail packaging, and point-of-sale assembly',
      'Woodworking, trim attachment, and light furniture production',
      'Maintenance repairs, cable dressing, and low-complexity fixture work',
    ],
    procurementChecklist: [
      'Record substrate pair, service temperature, and bond strength requirement.',
      'Specify glue-stick diameter, gun type, and expected daily consumption.',
      'Confirm whether clear, amber, white, or removable adhesive is preferred for the line.',
    ],
    faq: [
      {
        question: 'How should buyers compare hot melt adhesives for production use?',
        answer:
          'Start with substrate compatibility, service temperature, and open time. A hot melt adhesive that sets too quickly or runs too slowly can create waste even if the unit cost looks attractive.',
      },
      {
        question: 'What specs matter most when purchasing hot melt glue sticks?',
        answer:
          'For most buyers the key specs are stick diameter, application temperature, viscosity, color, packaging quantity, and the surfaces being bonded. Those six checks prevent the majority of line-fit issues.',
      },
      {
        question: 'When should a buyer request a quote for hot melt adhesives instead of ordering directly?',
        answer:
          'Use RFQ when the order is repeat volume, multiple chemistries need to be compared, or landed cost and replenishment timing matter more than one-off unit price.',
      },
    ],
    guideSlugs: ['how-to-choose-hot-melt-adhesives-for-packaging-assembly-and-rework'],
  },
  'plastic-perforated-sheets': {
    metaTitle: 'Plastic Perforated Sheets for Guards, Panels & Fabrication',
    metaDescription:
      'Buy plastic perforated sheets by resin, thickness, hole pattern, open area, UV resistance, and sheet size for guards, panels, filtration, and fabrication.',
    summary:
      'Plastic perforated sheets are normally selected on material performance and downstream fabrication requirements. Buyers need a page that answers resin type, hole size, open area, stiffness, and chemical or UV exposure before they contact sourcing.',
    buyingFactors: [
      'Match resin grade to the environment: impact, chemicals, outdoor UV, washdown, or food-contact proximity.',
      'Compare sheet thickness, hole pattern, and open area against guarding, airflow, drainage, or visual-display requirements.',
      'Check sheet dimensions, cut-to-size expectations, and whether secondary fabrication is done in-house.',
    ],
    applications: [
      'Machine guards, ventilation panels, and protective covers',
      'Display fixtures, shelving infill, and architectural screens',
      'Drainage, filtration support, and lightweight process barriers',
    ],
    procurementChecklist: [
      'Define resin, thickness, hole size, and open-area target before RFQ.',
      'Confirm sheet size, cut tolerance, and whether flame or UV resistance is needed.',
      'List the environment: indoor, outdoor, washdown, or chemical exposure.',
    ],
    faq: [
      {
        question: 'What do buyers need to confirm before ordering plastic perforated sheets?',
        answer:
          'The minimum set is resin type, thickness, perforation pattern, open area, sheet size, and service environment. Without that, it is easy to receive a sheet that fits dimensionally but fails in use.',
      },
      {
        question: 'How do perforation pattern and open area affect selection?',
        answer:
          'They directly affect airflow, drainage, visibility, stiffness, and weight. Buyers should treat pattern choice as a functional spec, not just a cosmetic one.',
      },
      {
        question: 'When is a quote workflow better for perforated plastic sheets?',
        answer:
          'Use RFQ for custom cut sizes, repeated fabrication runs, unusual resin requirements, or orders where packing and freight affect total cost materially.',
      },
    ],
    guideSlugs: ['how-to-buy-plastic-perforated-sheets-for-guards-panels-and-fabrication'],
  },
  'shaft-grounding-rings': {
    metaTitle: 'Shaft Grounding Rings for VFD Motors & Bearing Protection',
    metaDescription:
      'Select shaft grounding rings by shaft diameter, mounting style, conductive fiber design, contamination exposure, and VFD duty to protect motor bearings.',
    summary:
      'Shaft grounding rings are typically bought to solve a very specific bearing-current problem on VFD-driven motors. The page should help engineers and buyers compare shaft size, mounting arrangement, conductive-fiber design, contamination tolerance, and retrofit fit before they ask for a quote.',
    buyingFactors: [
      'Start with shaft diameter, frame size, and whether the ring mounts inboard, outboard, or inside an existing end bracket.',
      'Check conductive-fiber material, enclosure exposure, and whether contamination, oil mist, or washdown will shorten service life.',
      'Verify that the selected ring matches the motor and drive duty instead of treating all shaft-grounding products as interchangeable.',
    ],
    applications: [
      'VFD-driven motors in pumps, fans, conveyors, and HVAC systems',
      'Bearing-current mitigation in process equipment and packaging lines',
      'Retrofit maintenance programs for motors with repeated bearing failures',
    ],
    procurementChecklist: [
      'Capture shaft diameter, motor model, drive type, and mounting clearance.',
      'Note enclosure environment: dust, washdown, oil mist, or corrosive exposure.',
      'Confirm whether hardware, bracket kit, or retrofit instructions are required.',
    ],
    faq: [
      {
        question: 'Why do buyers install shaft grounding rings on VFD motors?',
        answer:
          'They are primarily used to divert induced shaft voltage away from bearings. This reduces fluting, premature bearing damage, and unplanned motor maintenance.',
      },
      {
        question: 'Which specs matter most for shaft grounding rings?',
        answer:
          'Shaft diameter, mounting configuration, conductive-fiber design, enclosure exposure, and motor duty are the most important selection points.',
      },
      {
        question: 'When should a buyer request application support before ordering?',
        answer:
          'Request support when the motor is a retrofit, the mounting space is tight, the environment is aggressive, or repeated bearing failures suggest the root cause still needs to be confirmed.',
      },
    ],
    guideSlugs: ['how-to-specify-shaft-grounding-rings-for-vfd-motors'],
  },
  'plain-bearings': {
    metaTitle: 'Oil Seals & Rotary Shaft Seals for Pumps, Motors & Gearboxes',
    metaDescription:
      'Compare oil seals by shaft size, housing bore, lip design, elastomer, pressure, and contamination exposure for rotating industrial equipment.',
    summary:
      'On Machrio, the plain bearings category is also carrying oil seal intent, so the page needs to explicitly help buyers compare radial shaft seals by size, lip geometry, compound, and operating environment. Buyers searching oil seals are rarely browsing casually; they want to cross-check fit and failure risk quickly.',
    buyingFactors: [
      'Start with shaft diameter, housing bore, width, and whether the application is oil retention, dust exclusion, or both.',
      'Compare single-lip, dual-lip, and spring-loaded designs based on contamination risk, shaft finish, and direction of sealing duty.',
      'Match the elastomer to temperature, lubricant, speed, and chemical exposure instead of assuming NBR, FKM, and PU are interchangeable.',
    ],
    applications: [
      'Motors, pumps, gearboxes, reducers, and rotating process equipment',
      'Maintenance replacement for leaking or contaminated shaft-seal positions',
      'Procurement workflows where cross-reference fit and material confirmation matter before order',
    ],
    procurementChecklist: [
      'Record shaft diameter, housing bore, seal width, and rotation or pressure conditions.',
      'Confirm lip design, spring requirement, and elastomer compatibility with lubricant and temperature.',
      'Check whether dust exclusion, washdown, or abrasive contamination is part of the service environment.',
    ],
    faq: [
      {
        question: 'What do buyers need to confirm before ordering industrial oil seals?',
        answer:
          'The critical checks are shaft size, housing bore, seal width, lip design, elastomer, operating speed, and contamination exposure. A seal that matches only one dimension can still fail quickly in service.',
      },
      {
        question: 'How should buyers compare NBR, FKM, and polyurethane oil seals?',
        answer:
          'NBR is common for general oil service, FKM is often chosen for higher temperature and chemical resistance, and polyurethane is used where abrasion resistance matters. Material choice should follow the real operating environment, not just price.',
      },
      {
        question: 'When is RFQ the better path for oil seals?',
        answer:
          'Use RFQ when dimensions must be cross-referenced, material compatibility is uncertain, or the order involves repeated maintenance stock across multiple machines.',
      },
    ],
    guideSlugs: ['how-to-choose-oil-seals-for-rotating-equipment'],
  },
  'valve-lockout-devices': {
    metaTitle: 'Valve Lockout Devices for Ball, Gate & Butterfly Valves',
    metaDescription:
      'Shop valve lockout devices by valve type, handle size, lock points, material, and visibility for safer maintenance shutdowns and OSHA lockout/tagout programs.',
    summary:
      'Valve lockout devices should solve one job cleanly: isolate the correct valve, fit the hardware already installed, and support the lock ownership model used in the facility. The page needs to speak to valve type, handle geometry, lock points, visibility, and field durability instead of generic valve copy.',
    buyingFactors: [
      'Identify whether the lockout is for ball valves, gate valves, butterfly valves, or multi-turn handles before comparing products.',
      'Check handle size, stem access, available lock holes, and whether multiple technicians need to apply their own locks.',
      'Choose body material and color visibility based on washdown, outdoor exposure, and shared maintenance use.',
    ],
    applications: [
      'Mechanical shutdowns on process piping, HVAC, and utility isolation points',
      'LOTO programs for maintenance, contractors, and shutdown turnarounds',
      'Valve isolation in manufacturing, food processing, and facilities operations',
    ],
    procurementChecklist: [
      'Record valve type, handle dimensions, and lock-hole or shackle requirements.',
      'Confirm whether the device must work with existing padlocks and hasps.',
      'List environment factors such as UV exposure, washdown, temperature, and chemical contact.',
    ],
    faq: [
      {
        question: 'How should buyers choose between different valve lockout device styles?',
        answer:
          'Start with valve type and handle geometry. A ball-valve lockout, gate-valve cover, and universal cable-style device solve different isolation problems and should not be treated as substitutes.',
      },
      {
        question: 'Do valve lockout devices need to match the site padlock standard?',
        answer:
          'Yes. Buyers should confirm shackle diameter, number of locks required, and whether a hasp or group-lockout setup is already part of the procedure.',
      },
      {
        question: 'When is a quote better than direct checkout for valve lockout devices?',
        answer:
          'Use RFQ when you are standardizing across multiple valve types, buying for a facility-wide rollout, or need help mapping device sizes to installed equipment.',
      },
    ],
    guideSlugs: ['how-to-choose-lockout-tagout-kits-buying-guide'],
  },
  'aerosol-can-recycling-equipment': {
    metaTitle: 'Aerosol Can Recycling Equipment for Shop & Plant Waste Control',
    metaDescription:
      'Compare aerosol can recycling equipment by can-size range, puncture method, filter setup, grounding, throughput, and waste handling workflow.',
    summary:
      'Aerosol can recycling equipment is usually a compliance and workflow purchase, not a commodity buy. Buyers need clarity on can-size compatibility, puncture and filtration design, grounding, throughput, and downstream waste handling before they commit.',
    buyingFactors: [
      'Define can sizes, propellant types, and daily or weekly throughput before selecting puncture and filtration hardware.',
      'Check grounding, venting, filter replacement, and liquid-collection workflow against local waste-handling procedures.',
      'Compare service access, consumables, and whether the unit is intended for one workstation or a centralized waste station.',
    ],
    applications: [
      'Paint, lubricant, and chemical can disposal in maintenance shops',
      'Centralized waste stations in industrial plants and facilities teams',
      'Workflows where hazardous-waste handling cost is tied to can preparation',
    ],
    procurementChecklist: [
      'List aerosol can sizes, chemistry types, and expected disposal volume.',
      'Confirm filter replacement process, grounding needs, and waste-container setup.',
      'Check whether the site needs a benchtop, wall-mount, or centralized station format.',
    ],
    faq: [
      {
        question: 'What should buyers confirm before purchasing aerosol can recycling equipment?',
        answer:
          'The key checks are compatible can sizes, throughput, puncture and filtration method, grounding, and how liquids and spent filters will be handled after use.',
      },
      {
        question: 'Why is throughput important for aerosol can recycling equipment?',
        answer:
          'Because a unit that is technically compatible but too slow for the waste stream creates bottlenecks and often ends up bypassed by operators.',
      },
      {
        question: 'When should a site request a quote for aerosol can recycling equipment?',
        answer:
          'RFQ is best when multiple departments use aerosols, hazardous-waste procedures are strict, or the site needs help sizing the equipment to disposal volume.',
      },
    ],
  },
  'lockout-padlocks': {
    metaTitle: 'Lockout Padlocks with Short Shackle & Nylon Bodies',
    metaDescription:
      'Source lockout padlocks by keyed alike or keyed different setup, short shackle or small shackle fit, nylon body construction, and color coding for OSHA LOTO programs.',
    summary:
      'Lockout padlocks are one of the clearest purchase-intent categories on Machrio, so this page should act like a sourcing page for short shackle, small shackle, and nylon-body lockout needs instead of a generic catalog. Buyers usually want to settle keying policy, compact shackle fit, body material, and color control before they compare price.',
    buyingFactors: [
      'Confirm lock ownership model first: keyed different, keyed alike, or controlled master-key workflow by department or site.',
      'Match short shackle, small shackle, and shackle diameter requirements to hasps, breakers, valve devices, and compact lockout points before comparing price.',
      'Choose nylon or other plastic lockout lock bodies when electrical insulation and lightweight daily use matter more than all-metal construction.',
    ],
    applications: [
      'Personal lockout ownership in OSHA 1910.147 programs',
      'Compact lock points where a short shackle padlock fits better than a long-shackle format',
      'Group lockout procedures using hasps, lock boxes, and department color coding',
    ],
    procurementChecklist: [
      'List keyed-alike, keyed-different, or master-key requirements by site policy.',
      'Check short shackle clearance, shackle diameter, and any small shank limitations at the isolation point.',
      'Confirm nylon-body preference, color assignments, user count, and replacement-key control before checkout.',
    ],
    faq: [
      {
        question: 'How should buyers choose between keyed alike and keyed different lockout padlocks?',
        answer:
          'Use keyed different when individual lock ownership and accountability are required. Use keyed alike only when the site procedure explicitly allows shared-key workflows for a defined group or department.',
      },
      {
        question: 'What lockout padlock specs usually drive purchasing decisions?',
        answer:
          'For most facilities the key specs are keying method, shackle height, short shackle clearance, shackle diameter, body material, electrical insulation, and color coding.',
      },
      {
        question: 'When should buyers choose a short shackle lockout padlock?',
        answer:
          'Short shackle lockout padlocks are usually preferred when the lock point is tight, the device opening is shallow, or the site wants less excess shackle movement during daily LOTO use.',
      },
      {
        question: 'Are nylon or plastic lockout padlocks better for electrical work?',
        answer:
          'They are often preferred where electrical insulation, lightweight handling, and visible color coding matter. Buyers should still confirm the exact shackle and body specs against the site procedure and installed devices.',
      },
      {
        question: 'When is a quote better than direct checkout for lockout padlocks?',
        answer:
          'RFQ is the better route for site standardization, department color programs, mixed shackle sizes, or any order where replacement-key control matters.',
      },
    ],
    guideSlugs: ['how-to-choose-lockout-tagout-kits-buying-guide'],
    priorityLinksHeading: 'Keep Padlocks Connected to the Full LOTO Workflow',
    priorityLinksDescription:
      'Buyers rarely standardize padlocks in isolation. Use these pages to keep shackle fit, hasps, and device-specific lockouts aligned.',
    priorityLinks: [
      {
        slug: 'lockout-tagout',
        name: 'Lockout Tagout',
        description: 'Use the main LOTO hub when you need padlocks, tags, hasps, and device lockouts planned together.',
      },
      {
        slug: 'lockout-hasps',
        name: 'Lockout Hasps',
        description: 'Pair short shackle padlocks with hasps sized to the right shackle diameter and user count.',
      },
      {
        slug: 'valve-lockout-devices',
        name: 'Valve Lockout Devices',
        description: 'Check padlock fit against the valve lockout hardware already installed on site.',
      },
      {
        slug: 'electrical-lockout-devices',
        name: 'Electrical Lockout Devices',
        description: 'Match insulated padlock requirements to breaker and plug lockout points.',
      },
    ],
  },
  'industrial-safety-pins': {
    metaTitle: 'Industrial Safety Pins by Material, Length & Wire Diameter',
    metaDescription:
      'Compare industrial safety pins by material, wire diameter, overall length, corrosion resistance, closure style, and pack quantity for shop and field use.',
    summary:
      'Industrial safety pins are usually bought for a functional use case such as tagging, temporary fastening, blanket retention, or bundled materials. The page should make material, size, closure style, and environment obvious so buyers can distinguish industrial pins from generic office or apparel products.',
    buyingFactors: [
      'Compare material, finish, and corrosion resistance against the real environment instead of treating all safety pins as equivalent.',
      'Check wire diameter, length, and locking style because retention performance changes quickly with size.',
      'Confirm whether the purchase is for shop consumables, maintenance kits, thermal covers, or repeated field use.',
    ],
    applications: [
      'Temporary fastening, tagging, and bundled material retention',
      'Industrial blankets, covers, insulation, and maintenance kits',
      'Shop-floor consumables where corrosion resistance or pack size matters',
    ],
    procurementChecklist: [
      'Define material, finish, wire diameter, and overall length.',
      'Note whether the application is indoor, washdown, or corrosive.',
      'Set preferred pack quantity and whether repeat replenishment is expected.',
    ],
    faq: [
      {
        question: 'What should buyers compare when sourcing industrial safety pins?',
        answer:
          'Material, finish, wire diameter, overall length, and closure style are the main variables. Those choices determine whether the pin holds reliably in the intended industrial use.',
      },
      {
        question: 'Are industrial safety pins different from consumer safety pins?',
        answer:
          'Yes. Industrial buyers usually care about material quality, corrosion resistance, dimensional consistency, and pack quantity because the pins support a repeated operational task rather than casual use.',
      },
      {
        question: 'When does it make sense to request a quote for industrial safety pins?',
        answer:
          'Use RFQ when you need recurring replenishment, unusual pack formats, or application guidance on material and size selection.',
      },
    ],
  },
  'fume-extractors': {
    metaTitle: 'Fume Extractors for Welding, Soldering & Process Air Control',
    metaDescription:
      'Source fume extractors by airflow, arm reach, filter stages, particulate type, duty cycle, and noise level for welding, soldering, laser, and bench work.',
    summary:
      'Fume extractors are typically selected around contaminant type and workstation layout. Buyers want to know whether the unit fits welding, soldering, laser, or bench extraction, what filtration stages are included, and whether airflow remains effective at the hood.',
    buyingFactors: [
      'Start with the contaminant: welding fumes, solder smoke, laser particulate, grinding dust, or mixed bench processes.',
      'Compare airflow at the hood, arm length, filter stack, replacement cycle, and noise level in the real working configuration.',
      'Check whether the unit is portable, bench-mounted, or intended for fixed-cell extraction.',
    ],
    applications: [
      'Welding stations, soldering benches, and electronics assembly',
      'Laser marking, light grinding, and small process-enclosure extraction',
      'Portable capture for maintenance, rework, and training cells',
    ],
    procurementChecklist: [
      'Define contaminant type, capture distance, and operator layout.',
      'Confirm airflow target, arm length, filter stages, and service intervals.',
      'List noise, mobility, and power constraints before RFQ.',
    ],
    faq: [
      {
        question: 'What matters most when buying a fume extractor?',
        answer:
          'The most important checks are contaminant type, airflow at the hood, filter configuration, arm reach, and maintenance interval. Those determine whether the extractor works in production instead of only on paper.',
      },
      {
        question: 'Can one fume extractor cover welding and soldering tasks?',
        answer:
          'Sometimes, but only if airflow, filtration media, and duty cycle are sized for both. Buyers should confirm the contaminant load instead of assuming one unit fits every process.',
      },
      {
        question: 'When should a buyer use RFQ for fume extractors?',
        answer:
          'RFQ is best when multiple benches are involved, airflow validation matters, or the site needs help choosing between portable, bench, and fixed-cell extraction formats.',
      },
    ],
  },
  'floor-mats': {
    metaTitle: 'Floor Mats for Anti-Fatigue, Drainage & Facility Protection',
    metaDescription:
      'Buy floor mats by use case, surface pattern, drainage, chemical resistance, bevel edges, and cleaning method for industrial and commercial facilities.',
    summary:
      'Floor mats are often searched broadly, but buyers are usually trying to solve one of three things: anti-fatigue comfort, slip resistance, or surface protection. The page should help them separate those use cases fast and compare material, drainage, edge profile, and cleaning method.',
    buyingFactors: [
      'Decide first whether the job is anti-fatigue, entrance control, drainage, or floor protection because those formats are not interchangeable.',
      'Compare surface texture, bevel edges, chemical and oil resistance, and cleaning method for the actual facility environment.',
      'Check roll length or mat size against workstation layout so the product fits without excessive trimming or seams.',
    ],
    applications: [
      'Assembly lines, packing stations, and standing work cells',
      'Entrances, wet areas, washdown zones, and locker rooms',
      'Surface protection for carts, benches, and traffic lanes',
    ],
    procurementChecklist: [
      'Specify use case: anti-fatigue, drainage, entrance, or protection.',
      'Confirm exposure to oils, chemicals, water, and cleaning routine.',
      'List preferred size, edge profile, and whether loose lay or roll stock is needed.',
    ],
    faq: [
      {
        question: 'How should buyers choose between anti-fatigue and drainage floor mats?',
        answer:
          'Use anti-fatigue mats where standing comfort is the priority. Use drainage mats where water, oils, or debris must move away from the walking surface. Many sites need both in different zones.',
      },
      {
        question: 'Which floor mat specs usually matter most in industrial environments?',
        answer:
          'Use case, material, slip resistance, bevel edges, size, and exposure to oils or cleaning chemicals are usually the key filters.',
      },
      {
        question: 'When is a quote useful for floor mats?',
        answer:
          'RFQ is useful when a facility is standardizing multiple stations, needs custom lengths, or wants to compare total landed cost on repeated replenishment.',
      },
    ],
  },
  'handrail-brackets': {
    metaTitle: 'Handrail Brackets by Projection, Load & Mounting Style',
    metaDescription:
      'Select handrail brackets by projection, rail diameter, mounting style, finish, load requirement, and pack size for facility and construction projects.',
    summary:
      'Handrail brackets are usually bought against installation constraints rather than generic hardware searches. Buyers want rail size, wall projection, finish, load capability, and mounting configuration surfaced quickly so they can match a bracket to the project spec.',
    buyingFactors: [
      'Check rail diameter, wall projection, mounting face, and installation substrate before comparing finishes.',
      'Confirm finish and corrosion resistance for indoor, outdoor, or public-facing installations.',
      'Compare load requirement, fastener expectations, and whether the job is replacement or new construction.',
    ],
    applications: [
      'Commercial stairways, corridors, and public-access facilities',
      'Retrofit maintenance and replacement hardware projects',
      'Construction, fit-out, and facility upgrade work',
    ],
    procurementChecklist: [
      'Record rail size, projection requirement, and mounting style.',
      'Confirm finish, corrosion exposure, and any architectural constraints.',
      'Check pack quantity, included hardware, and project schedule needs.',
    ],
    faq: [
      {
        question: 'What should buyers confirm before ordering handrail brackets?',
        answer:
          'Rail diameter, projection, mounting method, finish, and installation environment are the five checks that prevent most bracket-selection mistakes.',
      },
      {
        question: 'Why does projection matter when purchasing handrail brackets?',
        answer:
          'Projection affects code fit, user clearance, and how the rail aligns to the wall. A bracket can match the rail diameter and still fail the installation if projection is wrong.',
      },
      {
        question: 'When should a project use RFQ for handrail brackets?',
        answer:
          'Use RFQ for multi-location projects, mixed finishes, replacement schedules, or jobs where bracket quantity and freight need to be planned together.',
      },
    ],
  },
  'mop-sinks': {
    metaTitle: '24x24 Stainless Steel Mop Sinks & Service Sinks',
    metaDescription:
      'Buy mop sinks by 24x24 basin size, stainless steel construction, drain configuration, faucet compatibility, and wall or floor mount for janitorial rooms and washdown areas.',
    summary:
      'Mop sink demand is behaving like a spec-led facilities purchase, especially around 24x24 stainless steel replacements, drain layout, and faucet fit. This page should help buyers confirm basin size, material, drain configuration, and accessory compatibility before they compare price.',
    buyingFactors: [
      'Start with basin size and replacement footprint, especially when the buyer is specifically looking for a 24x24 stainless steel mop sink.',
      'Check drain configuration, drain location, and waste-line alignment before ordering a sink that looks right but misses the plumbing rough-in.',
      'Confirm faucet compatibility, hose support, and whether the project is a one-off replacement or a multi-site janitorial-room standard.',
    ],
    applications: [
      'Janitorial closets, washdown rooms, and maintenance service areas',
      'Commercial buildings, healthcare, food service, and education facilities',
      'Replacement plumbing projects where drain position and faucet compatibility matter',
    ],
    procurementChecklist: [
      'Specify mount style, exact basin dimensions, material, and whether 24x24 is a hard replacement requirement.',
      'Confirm center-drain or rear-drain layout, strainer or grate preference, and waste-line compatibility before checkout.',
      'List faucet spacing, hose-thread needs, vacuum-breaker requirements, and whether wall protection is needed.',
    ],
    faq: [
      {
        question: 'What matters most when buying a mop sink?',
        answer:
          'Mount style, basin size, material, drain setup, and faucet compatibility are the main selection points. Those determine whether the sink fits both the room and the cleaning workflow.',
      },
      {
        question: 'Is a 24x24 stainless steel mop sink a common replacement format?',
        answer:
          'Yes. Many facilities teams search for 24x24 stainless steel mop sinks because that footprint appears in janitorial-room replacements and retrofit work where floor space and rough-in locations are already fixed.',
      },
      {
        question: 'How should buyers compare mop sink drain configurations?',
        answer:
          'The key check is whether the sink uses the same drain location and waste alignment the room is already built around. Rear-drain and center-drain layouts can change installation labor even when basin size is identical.',
      },
      {
        question: 'Will an existing service sink faucet fit a new mop sink?',
        answer:
          'Sometimes, but buyers should confirm faucet centers, wall clearance, hose-thread requirements, and vacuum-breaker needs before assuming the existing faucet will transfer cleanly.',
      },
      {
        question: 'When should a facility request a quote for mop sinks?',
        answer:
          'RFQ is the better route for multi-site standards, replacement projects with matching accessories, or any order where installation details need review before purchasing.',
      },
    ],
  },
  'haz-loc': {
    metaTitle: 'Hazardous-Location Lockout Solutions (HazLoc) for Energy Isolation',
    metaDescription:
      'Source safe isolation components for hazardous locations by electrical area classification, mounting envelope, certification requirements, and lockout workflow.',
    summary:
      'HazLoc isolation should start from compliance and environment, not just size. Buyers need clarity on area classification, connector compatibility, lockout device type, and physical fit so they can confirm in-plant feasibility before checkout.',
    buyingFactors: [
      'Verify the hazardous-area classification and the required protection approach before selecting terminal or device-level hardware.',
      'Check compatibility across lockout points, switch blocks, and terminal interfaces before mixing products.',
      'Confirm certification and labeling requirements (Ex/ATEX, UL, CSA or local equivalent) and how they fit your existing permit regime.',
    ],
    applications: [
      'Hazardous-area breaker lockout and panel shutdown workflows',
      'Plant isolation programs where lockout hardware must align with electrical zoning',
      'Maintenance teams standardizing lock ownership under compliance-controlled processes',
    ],
    procurementChecklist: [
      'List hazardous-zone class/division, equipment model family, and required approval marks.',
      'Record exact breaker/terminal interface dimensions, lock hasp interface, and available maintenance clearances.',
      'Check whether the facility needs intrinsic-safe accessories, compatible covers, and label-ready procedures.',
    ],
    faq: [
      {
        question: 'How should buyers compare lockout options for HazLoc environments?',
        answer:
          'Buyers should compare terminal compatibility, zone compatibility, certification scope, and replacement keying or key-control policy together instead of evaluating components in isolation.',
      },
      {
        question: 'Can ordinary lockout components be used in explosive environments?',
        answer:
          'Usually not without explicit compliance checks. For HazLoc points, verify classification, equipment approvals, and mounting method first, then confirm stock and replacement path.',
      },
      {
        question: 'When should RFQ be used for HazLoc lockout components?',
        answer:
          'RFQ is recommended when multiple zone classes, device brands, or installation variants exist and you need a full compliance + fit confirmation plan.',
      },
    ],
    guideSlugs: ['how-to-choose-lockout-tagout-kits-buying-guide'],
  },
  'explosion-proof-limit-switch': {
    metaTitle: 'Explosion-Proof Limit Switches for Safe Plant Isolation',
    metaDescription:
      'Evaluate explosion-proof limit switches by zone class, mounting style, travel range, and lockout compatibility before sourcing from stock or quoted runs.',
    summary:
      'Explosion-proof limit switches are compliance-sensitive procurement items. The page should help buyers verify switch type, mounting method, wiring constraints, and replacement compatibility before purchase.',
    buyingFactors: [
      'Check whether the existing limit-switch style is direct-mount or retrofit and whether replacement is truly plug-compatible.',
      'Verify zone class assumptions, certification labels, and ambient constraints before ordering multiple SKUs.',
      'Confirm travel range and actuator access, especially if replacement timing is urgent.',
    ],
    applications: [
      'Hazardous area motor or conveyor shutdown points',
      'Conveyed-material systems and process-control isolated shutoffs',
      'Preventive maintenance and replacement projects with strict downtime windows',
    ],
    procurementChecklist: [
      'Capture motor/control cabinet model, hazardous-zone type, and approved switch spec.',
      'List existing wiring method, mounting depth, and replacement spare part standards.',
      'Confirm stock lead time constraints for in-house maintenance windows.',
    ],
    faq: [
      {
        question: 'What is the first step when sourcing explosion-proof limit switches?',
        answer:
          'Confirm the existing zone class and switch family first, then choose a replacement path based on mounting compatibility and certification compatibility.',
      },
      {
        question: 'Can stock checks be done before full RFQ?',
        answer:
          'Yes. For urgent replacement points, confirm exact model parity and shipping window first, then convert to RFQ if multiple variants are needed.',
      },
      {
        question: 'When should the team switch from direct checkout to quote?',
        answer:
          'Use RFQ when multiple certified variants are possible or when procurement needs compatibility validation across several hazardous locations.',
      },
    ],
  },
  'terminal-bridge-connectors': {
    metaTitle: 'Terminal Bridge Connectors for Reliable Electrical Lockout Work',
    metaDescription:
      'Compare terminal bridge connectors by pin spacing, dielectric strength, mounting durability, and lockout compatibility for breaker and panel workflows.',
    summary:
      'Terminal bridge connectors are often treated as generic hardware but usually fail in the field due to pin mismatch. This page should help buyers check size, spacing, and isolation compatibility before selecting stock or quoting.',
    buyingFactors: [
      'Validate pin spacing and terminal pitch against actual equipment drawings before deciding quantity.',
      'Check if connector body material and insulation match the ambient environment and lockout requirements.',
      'Separate temporary isolation connectors and long-term replacement parts by maintenance strategy.',
    ],
    applications: [
      'Breaker lockout and maintenance handover kits',
      'Electrical isolation tasks requiring temporary bridging',
      'Procurement refreshes where connector compatibility drives downtime risk',
    ],
    procurementChecklist: [
      'Capture pin pitch, terminal depth, rated current, and insulation class.',
      'Confirm panel clearances and whether existing accessories are reusable.',
      'Check whether connector stocks are needed for same-day shutdown replacement.',
    ],
    faq: [
      {
        question: 'How should we avoid wrong terminal connector selection?',
        answer:
          'Start with measured connector geometry and panel interface photos before comparing catalog variants. A small geometry mismatch creates major field delays.',
      },
      {
        question: 'What is the best way to validate connector feasibility quickly?',
        answer:
          'Batch-check core sizes, pin spacing, and keying pattern against a small representative sample before bulk purchase.',
      },
      {
        question: 'When should RFQ be used for terminal bridge connectors?',
        answer:
          'When multiple panel families are involved, or when lead time risk requires a full replacement-scope validation instead of single-item checkout.',
      },
    ],
  },
  'rf-coax-connectors': {
    metaTitle: 'RF/Coax Connectors for Industrial Control and Instrumentation',
    metaDescription:
      'Source RF and coax connectors by connector family, shielding, impedance, bend radius, and current stock status for industrial control, telecom, and instrumentation paths.',
    summary:
      'RF/coax connector buying is usually high-friction when signal chain compatibility is unclear. Buyers should resolve interface type, pinout, shielding, and mechanical retention before purchase.',
    buyingFactors: [
      'Verify connector family (BNC, SMA, N-type, F, etc.) and required impedance profile first.',
      'Compare cable compatibility, shielding level, and bend handling with planned cable runs.',
      'Distinguish direct stockable connectors from items needing lead-time confirmation and RF validation.',
    ],
    applications: [
      'Industrial instrumentation and field telemetry wiring',
      'Control cabinets with mixed connector generations',
      'Project-ready procurement where downtime is sensitive to cable mismatches',
    ],
    procurementChecklist: [
      'Record exact connector gender, shell type, keying method, and cable interface.',
      'Check whether grounding/strain relief and environmental seals are mandatory.',
      'Request stock verification for the first batch and a replacement path for extended rollout.',
    ],
    faq: [
      {
        question: 'What should be validated before direct-purchasing RF/coax connectors?',
        answer:
          'Connector family, impedance target, cable compatibility, and required mechanical retention are the minimum checks. Missing any one increases risk of rework.',
      },
      {
        question: 'Are these connectors typically stocked?',
        answer:
          'Some connectors are frequently stocked while high-frequency or specialized variants are often lead-time items. A short feasibility check usually prevents wrong-route orders.',
      },
      {
        question: 'When should RFQ be used for connector rollouts?',
        answer:
          'RFQ is suitable when multiple interface standards are involved or when a single connector decision affects a larger project bill of materials.',
      },
    ],
  },
  'cleanroom-bucket': {
    metaTitle: 'Cleanroom Buckets and Service Buckets for Controlled Environments',
    metaDescription:
      'Select cleanroom-capable mop buckets by surface material, lid retention, contamination control, and replacement-stock feasibility for clean environments.',
    summary:
      'Cleanroom bucket selection is more than size. Buyers should verify construction material, sealing method, contamination-control performance, and stocking depth before comparing offers.',
    buyingFactors: [
      'Check bucket body material and sealing path for your contamination class.',
      'Match lid design, handle stability, and footprint to your standard cleaning workflow.',
      'Verify compatibility with cleaning supplies and cleaning-cycle frequency before setting reorder quantities.',
    ],
    applications: [
      'Pharma and biotech cleanrooms',
      'Electronics and precision manufacturing support teams',
      'High-control janitorial and service workflows with repeat scheduling',
    ],
    procurementChecklist: [
      'Record material, volume, lid/handle requirements, and wipe-resistant finish needs.',
      'Define replacement lead time and preventive maintenance cycle needs.',
      'Check if mop, wringer, and accessory compatibility can be standardized.',
    ],
    faq: [
      {
        question: 'What matters most for cleanroom bucket purchasing?',
        answer:
          'Material compatibility, contamination control design, and operational compatibility with existing tooling are the core checks for cleanroom buckets.',
      },
      {
        question: 'How to reduce risk in cleanroom bucket replenishment?',
        answer:
          'Standardize size and lid/accessory specs across lines and confirm supplier stock before placing multi-site replenishment.',
      },
      {
        question: 'When is RFQ better for cleanroom buckets?',
        answer:
          'RFQ helps when multiple facility sites or compliance constraints exist, especially if replacement consistency matters across shifts.',
      },
    ],
  },
  flooring: {
    metaTitle: 'Industrial Flooring & Floor Protection Materials',
    metaDescription:
      'Choose flooring solutions by traffic class, slip performance, chemical resistance, installation method, and lead-time for production-ready rollout.',
    summary:
      'Flooring procurement on industrial sites is mostly specification-led. Buyers should check use-case class, thickness, adhesion method, and replacement pattern before comparing RFQ and checkout options.',
    buyingFactors: [
      'Validate load class, wear target, and chemical exposure before any supplier comparison.',
      'Compare installation process, seam handling, and maintenance burden as part of long-term floor ownership.',
      'Separate direct stock candidates from custom spec batches when planning budget and timing.',
    ],
    applications: [
      'Warehouses and loading zones with heavy traffic',
      'Clean and service aisles with specific slip/cleaning requirements',
      'Facility upgrades where replacement downtime is constrained',
    ],
    procurementChecklist: [
      'Record active loads, rolling impact, and required skid resistance.',
      'Capture adhesive/substrate requirements and required installation window.',
      'Decide between stocked modules and project-specific engineered rolls/tiles.',
    ],
    faq: [
      {
        question: 'How should we start a flooring procurement search?',
        answer:
          'Start from traffic class and environment, then choose between stocked standard sizes and engineered custom sizes.',
      },
      {
        question: 'When is RFQ needed for flooring?',
        answer:
          'RFQ helps for high-volume site upgrades, large engineered roll runs, and specifications requiring coordinated subgrade or adhesive planning.',
      },
    ],
  },
  epdm: {
    metaTitle: 'EPDM Materials and Accessories for Industrial Waterproofing',
    metaDescription:
      'Select EPDM compounds by thickness, hardness, UV resistance, temperature band, and compatibility for industrial waterproofing and gaskets.',
    summary:
      'EPDM buying decisions are sensitive to environmental fit and installation method. This page should help buyers choose compound and size spec, and confirm stock feasibility early.',
    buyingFactors: [
      'Define exposure temperature, UV exposure, chemical contact, and mechanical load before finalizing compound.',
      'Check thickness and hardness ranges against actual sealing location.',
      'Validate manufacturing lead times for custom profiles versus stocked profiles.',
    ],
    applications: [
      'Gasket, seal, and gasket-compatible replacement workflows',
      'Waterproofing and vibration damping in industrial environments',
      'Facility retrofit projects where material compatibility is constrained',
    ],
    procurementChecklist: [
      'Record temperature and weather profile, service life expectations, and compatible substrate.',
      'Measure critical dimensions and tolerances before order.',
      'Plan either stock check for standard profiles or RFQ for custom geometry.',
    ],
    faq: [
      {
        question: 'What should buyers compare for EPDM purchases?',
        answer:
          'Thickness, hardness, UV resistance, and substrate compatibility are the non-negotiable comparison points for durable EPDM outcomes.',
      },
      {
        question: 'Can standard EPDM stock satisfy engineered wood or flooring upgrades?',
        answer:
          'Sometimes, but only when size, tolerance, and environment-specific hardness requirements match the project spec.',
      },
      {
        question: 'When is quote support useful for EPDM?',
        answer:
          'Use RFQ for long-run projects, custom profiles, and multi-site rollout where spec uniformity and delivery timing matter.',
      },
    ],
  },
  'engineered-wood-flooring': {
    metaTitle: 'Engineered Wood Flooring for Industrial and Facility Use',
    metaDescription:
      'Source engineered wood flooring by wear layer, finish, edge profile, slip behavior, and lead-time for facility and industrial-use zones.',
    summary:
      'Engineered wood flooring should be selected as a system: base, finish, edge, and installation method all affect durability. Buyers should resolve use-zone requirements before procurement.',
    buyingFactors: [
      'Match thickness, finish class, and edge profile to the actual load and maintenance cycle.',
      'Check moisture tolerance, installation method, and adhesive compatibility with existing subfloor.',
      'Split direct stockable standard boards from custom lot runs for timing control.',
    ],
    applications: [
      'High-traffic service and support corridors with industrial load needs',
      'Commercial and mixed-use industrial-adjacent spaces',
      'Maintenance and replacement cycles where uptime and consistency matter',
    ],
    procurementChecklist: [
      'Capture subfloor profile, expected load class, and installation method.',
      'Record acoustic and slip requirements, finish treatment, and expected service life.',
      'Define lot size and replacement frequency to decide stock vs RFQ routing.',
    ],
    faq: [
      {
        question: 'How to choose engineered wood flooring for industrial-adjacent spaces?',
        answer:
          'Prioritize wear layer, edge type, and maintenance routine over color alone, especially where replacement windows are constrained.',
      },
      {
        question: 'When should flooring be moved to RFQ flow?',
        answer:
          'RFQ is useful for multi-room or multi-site standardization with custom lot runs, especially when installation support is required.',
      },
    ],
  },
  'respiratory-protection': {
    metaTitle: 'Respiratory Protection for Dust, Fumes, Vapors & Compliance',
    metaDescription:
      'Compare respiratory protection by hazard type, respirator class, APF, cartridge compatibility, fit, and compliance before buying for plant or field use.',
    summary:
      'Respiratory protection is one of Machrio\'s clearest information-to-commercial bridges, so the page needs to behave like a decision page. Buyers typically want to narrow by hazard type, APF, cartridge system, fit-testing support, comfort, and compliance documentation.',
    buyingFactors: [
      'Start with contaminant type and exposure level: particulates, fumes, gases, vapors, or mixed hazards.',
      'Compare disposable, half-face, full-face, PAPR, and supplied-air options by APF, filter availability, and comfort for shift length.',
      'Check fit-testing support, accessory availability, and whether the respirator integrates with the rest of the PPE stack.',
    ],
    applications: [
      'Construction, welding, painting, maintenance, and chemical handling',
      'Manufacturing, healthcare, clean process work, and utility service',
      'Buyer education programs where product selection is tied to compliance',
    ],
    procurementChecklist: [
      'Define hazard type, exposure duration, and required protection factor.',
      'Confirm respirator class, cartridge or filter family, and fit-testing needs.',
      'List comfort, field of vision, and PPE compatibility constraints before RFQ.',
    ],
    faq: [
      {
        question: 'How should buyers compare respiratory protection options?',
        answer:
          'Begin with hazard type and required protection factor, then narrow by respirator class, cartridge compatibility, fit, and shift comfort. Buying by appearance or price alone usually leads to the wrong product class.',
      },
      {
        question: 'Why is fit just as important as filter type when buying respirators?',
        answer:
          'A certified respirator still underperforms if the user cannot achieve a reliable face seal. Fit, size range, and fit-testing support are part of the purchase decision, not an afterthought.',
      },
      {
        question: 'When should a buyer request support before ordering respiratory protection?',
        answer:
          'Use RFQ or application support when hazards are mixed, APF requirements are unclear, or the site is standardizing a respiratory program across multiple teams.',
      },
    ],
    guideSlugs: [
      'how-to-choose-respiratory-protection-buying-guide',
      'how-to-choose-respirator-for-your-job',
    ],
  },
  'lockout-tagout': {
    metaTitle: 'Lockout Tagout Equipment Hub for Padlocks & Isolation',
    metaDescription:
      'Build a lockout tagout program around padlocks, hasps, valve devices, electrical lockout, and group isolation hardware from one OSHA 1910.147 sourcing hub.',
    summary:
      'Lockout tagout should function as a real sourcing hub on Machrio, not as a placeholder category. Buyers often start broad and then narrow into lockout padlocks first, followed by hasps, valve devices, electrical lockout, and group-isolation hardware. The page should guide that path clearly instead of splitting intent across thin pages.',
    buyingFactors: [
      'Map energy sources first: electrical, valve, pneumatic, and multi-point mechanical isolation do not use the same devices.',
      'Separate personal lock ownership, group lockout, and contractor workflows before choosing hardware.',
      'Standardize padlock keying, short shackle fit, tags, hasps, and storage or lock-box requirements together instead of SKU by SKU.',
    ],
    applications: [
      'OSHA 1910.147 compliance programs and shutdown procedures',
      'Departmental standardization of padlocks, hasps, tags, and lock boxes',
      'Contractor and multi-trade maintenance events',
    ],
    procurementChecklist: [
      'List the energy-isolation devices currently used on site.',
      'Confirm whether the rollout covers individual users, group lockout, or both.',
      'Set padlock keying policy, short shackle requirements, label or tag format, and replacement planning.',
    ],
    faq: [
      {
        question: 'What should buyers buy together when standardizing lockout tagout?',
        answer:
          'Most programs need more than one SKU group: padlocks, tags, hasps, device-specific lockouts, and often group lockout boxes. Standardization works best when these are planned together.',
      },
      {
        question: 'How do buyers move from a broad lockout tagout search to the right product group?',
        answer:
          'Start by identifying the isolation point. Once the energy source is clear, buyers can move into padlocks, valve lockout, electrical lockout, or group lockout products with much less ambiguity.',
      },
      {
        question: 'What usually gets standardized first in a lockout tagout rollout?',
        answer:
          'Padlock policy usually comes first because keying method, color control, and shackle fit affect nearly every other device choice in the program.',
      },
      {
        question: 'When is RFQ the right path for lockout tagout equipment?',
        answer:
          'RFQ is ideal for site rollouts, mixed-device programs, replacement kits, or projects that need keying control and standardized color or label rules.',
      },
    ],
    guideSlugs: ['how-to-choose-lockout-tagout-kits-buying-guide'],
    priorityLinksHeading: 'Start with the Strongest LOTO Product Families',
    priorityLinksDescription:
      'These category links match the product groups buyers most often need after a broad lockout tagout search.',
    priorityLinks: [
      {
        slug: 'lockout-padlocks',
        name: 'Lockout Padlocks',
        description: 'Begin with keyed-alike or keyed-different padlocks, short shackle fit, and body material.',
      },
      {
        slug: 'lockout-hasps',
        name: 'Lockout Hasps',
        description: 'Support group lockout procedures with the right number of lock points and shackle clearance.',
      },
      {
        slug: 'valve-lockout-devices',
        name: 'Valve Lockout Devices',
        description: 'Match the device to ball valves, gate valves, and shared maintenance shutdowns.',
      },
      {
        slug: 'electrical-lockout-devices',
        name: 'Electrical Lockout Devices',
        description: 'Cover breaker, plug, and electrical isolation points that require insulated lockout hardware.',
      },
    ],
  },
}

const ARTICLE_TOPIC_CLUSTERS: Record<
  string,
  {
    title: string
    description: string
    categories: SeoCategoryLink[]
  }
> = {
  'how-to-choose-lockout-tagout-kits-buying-guide': {
    title: 'Continue with Lockout/Tagout Product Categories',
    description:
      'Move from the buying guide into the exact product families buyers normally compare during a LOTO rollout.',
    categories: [
      {
        slug: 'lockout-padlocks',
        name: 'Lockout Padlocks',
        description: 'Compare keyed-alike, keyed-different, insulated, and long-shackle lockout padlocks.',
      },
      {
        slug: 'valve-lockout-devices',
        name: 'Valve Lockout Devices',
        description: 'Match device type to ball valves, gate valves, and shared maintenance procedures.',
      },
      {
        slug: 'electrical-lockout-devices',
        name: 'Electrical Lockout Devices',
        description: 'Browse breaker, plug, and electrical isolation lockout devices for energized equipment.',
      },
    ],
  },
  'how-to-choose-respiratory-protection-buying-guide': {
    title: 'Continue with Respiratory Protection Categories',
    description:
      'Use the guide, then move into product categories that map to hazard type, fit, and replacement workflow.',
    categories: [
      {
        slug: 'respiratory-protection',
        name: 'Respiratory Protection',
        description: 'Browse respirator product families by hazard type, filter system, and fit requirements.',
      },
      {
        slug: 'respirator-fit-testing',
        name: 'Respirator Fit Testing',
        description: 'Review fit-related respirator options and adjacent products used in program setup.',
      },
    ],
  },
  'how-to-choose-respirator-for-your-job': {
    title: 'Shop Respiratory Categories by Use Case',
    description:
      'After identifying the job hazard, move into the respirator categories most buyers use to shortlist products.',
    categories: [
      {
        slug: 'respiratory-protection',
        name: 'Respiratory Protection',
        description: 'Compare N95, half-face, full-face, PAPR, and supplied-air options in one place.',
      },
      {
        slug: 'respirator-fit-testing',
        name: 'Respirator Fit Testing',
        description: 'Support respirator selection with fit, sizing, and program-adjacent product research.',
      },
    ],
  },
  'are-all-types-of-respirators-the-same': {
    title: 'Compare the Respiratory Product Families Mentioned in This Guide',
    description:
      'These categories help buyers move from concept-level differences into real product selection and RFQ decisions.',
    categories: [
      {
        slug: 'respiratory-protection',
        name: 'Respiratory Protection',
        description: 'Browse respirators by class, filter family, and workplace hazard.',
      },
      {
        slug: 'respirator-fit-testing',
        name: 'Respirator Fit Testing',
        description: 'Use fit-related research to narrow the right facepiece family and sizing path.',
      },
    ],
  },
  'air-respirator-buying-guide': {
    title: 'Move from the Guide into Respiratory Categories',
    description:
      'Use these category pages to compare respirator options after reviewing the buying checklist.',
    categories: [
      {
        slug: 'respiratory-protection',
        name: 'Respiratory Protection',
        description: 'Compare reusable and disposable respirator families by hazard and comfort.',
      },
      {
        slug: 'respirator-fit-testing',
        name: 'Respirator Fit Testing',
        description: 'Review adjacent respirator options and fit-related considerations before ordering.',
      },
    ],
  },
  'how-to-choose-hot-melt-adhesives-for-packaging-assembly-and-rework': {
    title: 'Move from Hot Melt Adhesive Research into Product Categories',
    description:
      'Use these categories to compare hot melt purchasing options after narrowing chemistry, open time, and line-fit requirements.',
    categories: [
      {
        slug: 'hot-melt-adhesives',
        name: 'Hot Melt Adhesives',
        description: 'Browse hot melt adhesive formats and options by packaging, assembly, and maintenance use case.',
      },
      {
        slug: 'construction-adhesives',
        name: 'Construction Adhesives',
        description: 'Compare adjacent adhesive families when the application needs a non-hot-melt bonding path.',
      },
      {
        slug: 'caulks-and-sealants',
        name: 'Caulks and Sealants',
        description: 'Review adjacent sealant options when flexibility, weathering, or joint sealing matters more than hot-melt speed.',
      },
    ],
  },
  'how-to-buy-plastic-perforated-sheets-for-guards-panels-and-fabrication': {
    title: 'Compare the Plastic Sheet Category Behind This Buying Guide',
    description:
      'Move from specification research into the category buyers use to compare resin, perforation, and fabrication options.',
    categories: [
      {
        slug: 'plastic-perforated-sheets',
        name: 'Plastic Perforated Sheets',
        description: 'Browse perforated sheet options for guards, panels, airflow, drainage, and fabrication projects.',
      },
    ],
  },
  'how-to-specify-shaft-grounding-rings-for-vfd-motors': {
    title: 'Continue into VFD Motor Protection Categories',
    description:
      'Use these categories to move from bearing-current diagnosis into the products buyers compare for motor reliability and retrofit work.',
    categories: [
      {
        slug: 'shaft-grounding-rings',
        name: 'Shaft Grounding Rings',
        description: 'Compare shaft grounding ring options for retrofit fit, contamination tolerance, and VFD duty.',
      },
      {
        slug: 'plain-bearings',
        name: 'Plain Bearings and Oil Seals',
        description: 'Review adjacent rotating-equipment reliability products often purchased during maintenance troubleshooting.',
      },
    ],
  },
  'how-to-choose-oil-seals-for-rotating-equipment': {
    title: 'Move from Oil Seal Selection into Product Categories',
    description:
      'After confirming size, lip design, and elastomer, use these categories to compare the rotating-equipment products buyers usually shortlist next.',
    categories: [
      {
        slug: 'plain-bearings',
        name: 'Plain Bearings and Oil Seals',
        description: 'Browse oil-seal and adjacent rotating-equipment products with clearer commercial next steps.',
      },
    ],
  },
}

const PRODUCT_CATEGORY_RULES: Array<{
  slug: string
  name: string
  matchAll?: string[]
  matchAny?: string[]
}> = [
  {
    slug: 'valve-lockout-devices',
    name: 'Valve Lockout Devices',
    matchAll: ['valve', 'lockout'],
  },
  {
    slug: 'electrical-lockout-devices',
    name: 'Electrical Lockout Devices',
    matchAny: [
      'circuit breaker lockout',
      'breaker lockout',
      'electrical lockout',
      'plug lockout',
      'plug lock',
      'electrical and pneumatic plug lock',
    ],
  },
  {
    slug: 'lockout-hasps',
    name: 'Lockout Hasps',
    matchAny: ['lockout hasp', 'safety hasp', 'hasp lock'],
  },
  {
    slug: 'lockout-padlocks',
    name: 'Lockout Padlocks',
    matchAll: ['lockout', 'padlock'],
  },
  {
    slug: 'lockout-tagout',
    name: 'Lockout Tagout',
    matchAny: ['lockout tagout kit', 'lockout-tagout kit', 'loto kit', 'lockout tag'],
  },
  {
    slug: 'respiratory-protection',
    name: 'Respiratory Protection',
    matchAny: [
      'respirator',
      'respiratory protection',
      'full facepiece',
      'half face respirator',
      'papr',
      'supplied air',
      'air respirator',
      'filtering facepiece',
    ],
  },
  {
    slug: 'plain-bearings',
    name: 'Plain Bearings',
    matchAny: [
      'oil seal',
      'shaft seal',
      'radial seal',
      'skeleton oil seal',
      'radial shaft seal',
      'dual lip seal',
    ],
  },
]

const PRODUCT_QUERY_TOKEN_OVERRIDES: Record<string, string> = {
  'ptfe-composite-high-temp-safety-gloves-212-f-11-inch-length-pkg-qty-8-aj3551': '212F11',
}

const TITLE_SUFFIX_PATTERNS = [
  /\s*\|\s*Machrio Industrial Supplies\s*$/i,
  /\s*\|\s*Machrio\s*$/i,
]

const KEYWORD_STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'into',
  'inch',
  'inches',
  'length',
  'width',
  'height',
  'pkg',
  'qty',
  'model',
  'industrial',
  'products',
  'product',
  'equipment',
  'device',
  'devices',
  'supplies',
  'one',
  'size',
  'pack',
])

function normalizeText(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsAll(text: string, tokens: string[]): boolean {
  return tokens.every((token) => text.includes(normalizeText(token)))
}

function containsAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(normalizeText(token)))
}

function buildKeywordList(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 3 && !KEYWORD_STOP_WORDS.has(token))
}

export function normalizeSeoTitle(title: string | null | undefined): string {
  let normalized = (title || '').trim()

  for (const pattern of TITLE_SUFFIX_PATTERNS) {
    while (pattern.test(normalized)) {
      normalized = normalized.replace(pattern, '').trim()
    }
  }

  return normalized
}

export function withBrandSuffix(title: string | null | undefined): string {
  const normalized = normalizeSeoTitle(title)

  if (!normalized) {
    return 'Machrio'
  }

  return `${normalized} | Machrio`
}

export function getGuideLink(slug: string): SeoGuideLink | null {
  return GUIDE_LIBRARY[slug] || null
}

export function getGuideLinks(slugs: string[] = []): SeoGuideLink[] {
  return slugs
    .map((slug) => getGuideLink(slug))
    .filter((guide): guide is SeoGuideLink => guide !== null)
}

export function getPrimaryGuideForCategory(categorySlug?: string, tags: string[] = []): SeoGuideLink | null {
  const normalizedCategory = categorySlug || ''
  const slugs = CATEGORY_GUIDES[normalizedCategory] || []

  for (const slug of slugs) {
    const guide = getGuideLink(slug)
    if (guide) return guide
  }

  const normalizedTags = tags.map((tag) => normalizeText(tag))
  if (normalizedTags.some((tag) => tag.includes('lockout') || tag.includes('tagout'))) {
    return getGuideLink('how-to-choose-lockout-tagout-kits-buying-guide')
  }
  if (normalizedTags.some((tag) => tag.includes('respirat'))) {
    return getGuideLink('how-to-choose-respiratory-protection-buying-guide')
  }

  return null
}

export function getCategorySeoOverride(slug: string): SeoCategoryOverride | null {
  return CATEGORY_OVERRIDES[slug] || null
}

export function getArticleTopicCluster(slug: string): {
  title: string
  description: string
  categories: SeoCategoryLink[]
} | null {
  return ARTICLE_TOPIC_CLUSTERS[slug] || null
}

export function getCanonicalProductCategory(input: {
  name: string
  slug: string
  categorySlug?: string | null
  categoryName?: string | null
}): ProductCategoryContext {
  const fallbackSlug = input.categorySlug || 'products'
  const fallbackName = input.categoryName || 'Products'
  const haystack = normalizeText(
    `${input.name} ${input.slug} ${input.categorySlug || ''} ${input.categoryName || ''}`,
  )

  for (const rule of PRODUCT_CATEGORY_RULES) {
    const allMatch = rule.matchAll ? containsAll(haystack, rule.matchAll) : true
    const anyMatch = rule.matchAny ? containsAny(haystack, rule.matchAny) : true

    if (allMatch && anyMatch) {
      return { slug: rule.slug, name: rule.name }
    }
  }

  return { slug: fallbackSlug, name: fallbackName }
}

export function getProductExactMatchToken(slug: string): string | null {
  if (PRODUCT_QUERY_TOKEN_OVERRIDES[slug]) {
    return PRODUCT_QUERY_TOKEN_OVERRIDES[slug]
  }

  const compactModel = slug.match(/(?:^|-)(\d+)-([a-z])-(\d+)(?:-|$)/i)
  if (compactModel) {
    return `${compactModel[1]}${compactModel[2].toUpperCase()}${compactModel[3]}`
  }

  return null
}

export function getProductSeoName(input: {
  name: string
  slug: string
}): string {
  const exactToken = getProductExactMatchToken(input.slug)
  if (!exactToken) return input.name

  const normalizedName = normalizeText(input.name)
  const normalizedToken = normalizeText(exactToken)

  if (normalizedName.includes(normalizedToken)) {
    return input.name
  }

  return `${input.name} (${exactToken})`
}

export function getProductMetaDescription(input: {
  slug: string
  shortDescription?: string | null
}): string | null {
  const description = input.shortDescription?.trim()
  const exactToken = getProductExactMatchToken(input.slug)

  if (!description) return null
  if (!exactToken) return description
  if (normalizeText(description).includes(normalizeText(exactToken))) {
    return description
  }

  return `Model ${exactToken}. ${description}`
}

export function isRelevantRelatedProduct(
  currentProduct: {
    name: string
    slug: string
    categorySlug?: string | null
    categoryName?: string | null
  },
  candidate: {
    name: string
    slug: string
    categorySlug?: string | null
    categoryName?: string | null
  },
): boolean {
  const currentCanonical = getCanonicalProductCategory(currentProduct)
  const candidateCanonical = getCanonicalProductCategory(candidate)

  if (currentCanonical.slug !== candidateCanonical.slug) {
    return false
  }

  const currentKeywords = new Set(
    buildKeywordList(`${currentProduct.name} ${currentProduct.slug}`),
  )
  const candidateKeywords = buildKeywordList(`${candidate.name} ${candidate.slug}`)

  const overlapCount = candidateKeywords.filter((token) => currentKeywords.has(token)).length

  if (
    ['lockout-padlocks', 'lockout-hasps', 'valve-lockout-devices', 'electrical-lockout-devices'].includes(
      currentCanonical.slug,
    )
  ) {
    return overlapCount >= 1 || candidateKeywords.some((token) => token.includes('lockout'))
  }

  if (currentCanonical.slug === 'respiratory-protection') {
    return overlapCount >= 1 || candidateKeywords.some((token) => token.startsWith('respirat'))
  }

  if (currentCanonical.slug === 'plain-bearings') {
    return overlapCount >= 1 || candidateKeywords.some((token) => token.includes('seal'))
  }

  return overlapCount >= 1
}
