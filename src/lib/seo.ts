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

export interface SeoCategoryOverride {
  metaTitle: string
  metaDescription: string
  summary: string
  buyingFactors: string[]
  applications: string[]
  procurementChecklist: string[]
  faq: SeoFaq[]
  guideSlugs?: string[]
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
    metaTitle: 'Lockout Padlocks for OSHA LOTO Programs & Group Isolation',
    metaDescription:
      'Choose lockout padlocks by keyed-alike or keyed-different setup, shackle height, body material, insulation, and color coding for industrial LOTO programs.',
    summary:
      'Lockout padlocks are one of the clearest industrial search intents on Machrio right now, so the page needs to behave like a buying page, not a generic category. Buyers are usually comparing keyed-alike versus keyed-different systems, shackle geometry, body material, color control, and whether the lock fits the site LOTO procedure.',
    buyingFactors: [
      'Confirm lock ownership model first: keyed different, keyed alike, master key, or department color coding.',
      'Match shackle height and diameter to hasps, breakers, valve devices, and existing lockout points before comparing price.',
      'Choose nylon, steel, or aluminum bodies based on electrical exposure, corrosion risk, and durability requirements.',
    ],
    applications: [
      'Personal lockout ownership in OSHA 1910.147 programs',
      'Group lockout procedures using hasps and lock boxes',
      'Electrical, mechanical, and contractor shutdown workflows',
    ],
    procurementChecklist: [
      'List keyed-alike, keyed-different, or master-key requirements by site policy.',
      'Check shackle clearance, shackle diameter, and insulation requirements.',
      'Confirm how many colors, users, and replacement keys the program needs.',
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
          'For most facilities the key specs are keying method, shackle height, shackle diameter, body material, electrical insulation, and color coding.',
      },
      {
        question: 'When is a quote better than direct checkout for lockout padlocks?',
        answer:
          'RFQ is the better route for site standardization, department color programs, mixed shackle sizes, or any order where replacement-key control matters.',
      },
    ],
    guideSlugs: ['how-to-choose-lockout-tagout-kits-buying-guide'],
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
    metaTitle: 'Mop Sinks for Janitorial Rooms & Washdown Areas',
    metaDescription:
      'Buy mop sinks by mount style, basin size, material, drain setup, faucet compatibility, and washdown use for janitorial rooms and facility maintenance areas.',
    summary:
      'Mop sinks are a facilities purchase with plumbing, installation, and cleaning workflow requirements attached. Buyers usually need basin format, mount style, drain arrangement, and accessory compatibility made clear before they can compare price.',
    buyingFactors: [
      'Choose wall-mount or floor-mount format based on room layout, drainage, and cleaning workflow.',
      'Check basin size, material, drain location, and faucet compatibility before ordering accessories separately.',
      'Confirm whether the job is replacement, new build, or janitorial-room standardization across sites.',
    ],
    applications: [
      'Janitorial closets, washdown rooms, and maintenance service areas',
      'Commercial buildings, healthcare, food service, and education facilities',
      'Replacement plumbing projects where accessory compatibility matters',
    ],
    procurementChecklist: [
      'Specify mount style, basin size, drain location, and material.',
      'Confirm faucet, hose, and supply-line compatibility before checkout.',
      'List install environment, cleaning routine, and whether wall protection is needed.',
    ],
    faq: [
      {
        question: 'What matters most when buying a mop sink?',
        answer:
          'Mount style, basin size, drain setup, material, and faucet compatibility are the main selection points. Those determine whether the sink fits both the room and the cleaning workflow.',
      },
      {
        question: 'How do buyers decide between wall-mount and floor-mount mop sinks?',
        answer:
          'Wall-mount sinks can simplify floor cleaning and tight-room layouts, while floor-mount sinks are often chosen for heavier service and straightforward plumbing access.',
      },
      {
        question: 'When should a facility request a quote for mop sinks?',
        answer:
          'RFQ is the better route for multi-site standards, replacement projects with matching accessories, or any order where installation details need review before purchasing.',
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
    metaTitle: 'Lockout Tagout Equipment for OSHA 1910.147 Programs',
    metaDescription:
      'Build a lockout tagout program around padlocks, hasps, valve devices, electrical lockout, and group lockout tools sized to your isolation workflow.',
    summary:
      'Lockout tagout should function as a topic hub on Machrio, not as a placeholder category. Buyers often start broad and then break the purchase into padlocks, hasps, valve devices, electrical devices, and group lockout hardware. The page should guide that workflow clearly.',
    buyingFactors: [
      'Map energy sources first: electrical, valve, pneumatic, and multi-point mechanical isolation do not use the same devices.',
      'Separate personal lock ownership, group lockout, and contractor workflows before choosing hardware.',
      'Confirm padlock standards, shackle fit, tags, hasps, and storage or lock-box requirements together.',
    ],
    applications: [
      'OSHA 1910.147 compliance programs and shutdown procedures',
      'Departmental standardization of padlocks, hasps, tags, and lock boxes',
      'Contractor and multi-trade maintenance events',
    ],
    procurementChecklist: [
      'List the energy-isolation devices currently used on site.',
      'Confirm whether the rollout covers individual users, group lockout, or both.',
      'Set padlock keying policy, label/tag format, and replacement planning.',
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
        question: 'When is RFQ the right path for lockout tagout equipment?',
        answer:
          'RFQ is ideal for site rollouts, mixed-device programs, replacement kits, or projects that need keying control and standardized color or label rules.',
      },
    ],
    guideSlugs: ['how-to-choose-lockout-tagout-kits-buying-guide'],
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
