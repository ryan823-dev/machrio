export interface StaticGlossaryTerm {
  term: string
  slug: string
  full_name: string | null
  fullName: string | null
  definition: string
  category: string
  status: 'published'
}

export const STATIC_GLOSSARY_TERMS: readonly StaticGlossaryTerm[] = [
  {
    term: 'PPE',
    slug: 'ppe',
    full_name: 'Personal Protective Equipment',
    fullName: 'Personal Protective Equipment',
    definition:
      'Equipment worn to minimize exposure to hazards that cause serious workplace injuries and illnesses. PPE includes items such as hard hats, safety glasses, gloves, respirators, high-visibility clothing, and safety footwear.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'LOTO',
    slug: 'loto',
    full_name: 'Lockout/Tagout',
    fullName: 'Lockout/Tagout',
    definition:
      'A safety procedure used to ensure that dangerous machines and energy sources are properly shut off and not able to be started up again before maintenance or servicing is completed. Required by OSHA standard 29 CFR 1910.147.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'OSHA',
    slug: 'osha',
    full_name: 'Occupational Safety and Health Administration',
    fullName: 'Occupational Safety and Health Administration',
    definition:
      'A U.S. federal agency under the Department of Labor responsible for setting and enforcing workplace safety and health standards. OSHA regulations cover everything from fall protection to hazardous materials handling.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'SDS',
    slug: 'sds',
    full_name: 'Safety Data Sheet',
    fullName: 'Safety Data Sheet',
    definition:
      'A document that provides detailed information about a chemical product, including its properties, hazards, safe handling procedures, storage requirements, and emergency measures. Required under OSHA Hazard Communication Standard (HCS).',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'GHS',
    slug: 'ghs',
    full_name: 'Globally Harmonized System of Classification and Labelling of Chemicals',
    fullName: 'Globally Harmonized System of Classification and Labelling of Chemicals',
    definition:
      'An internationally agreed-upon system for classifying and communicating chemical hazards through standardized labels and safety data sheets. GHS uses pictograms, signal words, and hazard statements to convey risk information.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'ANSI',
    slug: 'ansi',
    full_name: 'American National Standards Institute',
    fullName: 'American National Standards Institute',
    definition:
      'A private, non-profit organization that oversees the development of voluntary consensus standards for products, services, and systems in the United States. ANSI standards are widely referenced in industrial safety equipment specifications.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'NRR',
    slug: 'nrr',
    full_name: 'Noise Reduction Rating',
    fullName: 'Noise Reduction Rating',
    definition:
      'A unit of measurement used to determine the effectiveness of hearing protection devices in reducing noise exposure. Measured in decibels (dB), a higher NRR indicates greater noise reduction. Common in earmuffs and earplugs specifications.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'Arc Flash',
    slug: 'arc-flash',
    full_name: null,
    fullName: null,
    definition:
      'A dangerous electrical explosion that occurs when an electric current flows through an air gap between conductors, creating a bright flash, intense heat (up to 35,000F), and a pressure wave. Arc-rated PPE is required for workers exposed to arc flash hazards.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'FR',
    slug: 'fr',
    full_name: 'Flame Resistant',
    fullName: 'Flame Resistant',
    definition:
      'A property of materials that resist ignition or self-extinguish when exposed to flame. FR clothing and materials are essential PPE in industries with fire, arc flash, or flash fire hazards such as oil and gas, electrical utilities, and welding.',
    category: 'safety',
    status: 'published',
  },
  {
    term: 'RoHS',
    slug: 'rohs',
    full_name: 'Restriction of Hazardous Substances',
    fullName: 'Restriction of Hazardous Substances',
    definition:
      'An EU directive that restricts the use of specific hazardous materials such as lead, mercury, and cadmium found in electrical and electronic products. RoHS compliance is mandatory for products sold in the European Union.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'REACH',
    slug: 'reach',
    full_name: 'Registration, Evaluation, Authorisation and Restriction of Chemicals',
    fullName: 'Registration, Evaluation, Authorisation and Restriction of Chemicals',
    definition:
      'A European Union regulation addressing the production and use of chemical substances and their potential impact on human health and the environment. Manufacturers and importers must register chemicals produced or imported above the reporting threshold.',
    category: 'standards',
    status: 'published',
  },
  {
    term: 'MRO',
    slug: 'mro',
    full_name: 'Maintenance, Repair, and Operations',
    fullName: 'Maintenance, Repair, and Operations',
    definition:
      'The category of supplies, equipment, and activities required to keep a facility, plant, or operation running. MRO encompasses everything from replacement parts and lubricants to cleaning supplies, safety equipment, and hand tools.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'Preventive Maintenance',
    slug: 'preventive-maintenance',
    full_name: null,
    fullName: null,
    definition:
      'A proactive maintenance strategy that involves regular, planned maintenance activities performed on equipment to reduce the likelihood of failure. It includes inspections, lubrication, adjustments, cleaning, and scheduled parts replacement.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'MTBF',
    slug: 'mtbf',
    full_name: 'Mean Time Between Failures',
    fullName: 'Mean Time Between Failures',
    definition:
      'A reliability metric that measures the average time elapsed between inherent failures of a mechanical or electronic system during normal operation. Higher MTBF values indicate more reliable equipment.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'CMMS',
    slug: 'cmms',
    full_name: 'Computerized Maintenance Management System',
    fullName: 'Computerized Maintenance Management System',
    definition:
      'Software that centralizes maintenance information and supports maintenance operations. A CMMS helps teams manage work orders, schedule preventive maintenance, track spare parts inventory, and generate reports.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'Downtime',
    slug: 'downtime',
    full_name: null,
    fullName: null,
    definition:
      'A period when a machine, system, or production line is not operational due to equipment failure, maintenance, or other reasons. Unplanned downtime can result in significant production losses and increased costs.',
    category: 'maintenance',
    status: 'published',
  },
  {
    term: 'Abrasion Resistance',
    slug: 'abrasion-resistance',
    full_name: null,
    fullName: null,
    definition:
      'The ability of a material to withstand rubbing, scraping, or erosion that removes material from the surface. It is a critical specification for gloves, footwear, conveyor belts, and industrial coatings.',
    category: 'materials',
    status: 'published',
  },
  {
    term: 'Tensile Strength',
    slug: 'tensile-strength',
    full_name: null,
    fullName: null,
    definition:
      'The maximum stress a material can withstand while being stretched or pulled before breaking, typically measured in PSI or MPa. It is a key specification for lifting slings, wire rope, chains, bolts, and structural components.',
    category: 'materials',
    status: 'published',
  },
  {
    term: 'IP Rating',
    slug: 'ip-rating',
    full_name: 'Ingress Protection Rating',
    fullName: 'Ingress Protection Rating',
    definition:
      'A two-digit code such as IP65 or IP67 that classifies enclosure protection against solid particle intrusion and water ingress. Higher numbers indicate stronger protection for harsh environments.',
    category: 'materials',
    status: 'published',
  },
  {
    term: 'Durometer',
    slug: 'durometer',
    full_name: null,
    fullName: null,
    definition:
      'A measurement of the hardness of rubber, elastomer, and polymer materials. It is commonly measured on Shore A or Shore D scales and is important for O-rings, gaskets, seals, wheels, and vibration dampening products.',
    category: 'materials',
    status: 'published',
  },
  {
    term: 'MOQ',
    slug: 'moq',
    full_name: 'Minimum Order Quantity',
    fullName: 'Minimum Order Quantity',
    definition:
      'The lowest quantity of a product that a supplier is willing to sell in a single order. MOQs are common in B2B industrial procurement and can vary between standard catalog items and custom-manufactured products.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'DDP',
    slug: 'ddp',
    full_name: 'Delivered Duty Paid',
    fullName: 'Delivered Duty Paid',
    definition:
      'An international trade term where the seller bears all costs and risks of delivering goods to the buyer location, including import duties, taxes, and customs clearance.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'RFQ',
    slug: 'rfq',
    full_name: 'Request for Quotation',
    fullName: 'Request for Quotation',
    definition:
      'A formal document sent to potential suppliers inviting them to submit a price quote for specified products or services. In industrial procurement, RFQs usually include specifications, quantities, delivery requirements, and payment terms.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'Lead Time',
    slug: 'lead-time',
    full_name: null,
    fullName: null,
    definition:
      'The total time from placing an order to receiving the goods, including production time, inspection, packaging, and shipping transit. Lead time is critical for MRO planning to prevent stockouts and production delays.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'SKU',
    slug: 'sku',
    full_name: 'Stock Keeping Unit',
    fullName: 'Stock Keeping Unit',
    definition:
      'A unique alphanumeric identifier assigned to a product for inventory management and tracking purposes. Each distinct product variation receives its own SKU to support accurate stock control and order fulfillment.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'FOB',
    slug: 'fob',
    full_name: 'Free On Board',
    fullName: 'Free On Board',
    definition:
      'An international trade term indicating the point at which the seller responsibility for goods ends and the buyer assumes risk and cost. FOB Origin transfers responsibility at the seller facility, while FOB Destination keeps seller risk until delivery.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'BOM',
    slug: 'bom',
    full_name: 'Bill of Materials',
    fullName: 'Bill of Materials',
    definition:
      'A comprehensive list of raw materials, components, assemblies, and quantities required to manufacture or maintain a product or system. BOMs are essential for procurement planning, cost estimation, and inventory management.',
    category: 'procurement',
    status: 'published',
  },
  {
    term: 'Torque',
    slug: 'torque',
    full_name: null,
    fullName: null,
    definition:
      'A rotational force applied to an object, measured in units such as Nm, ft-lb, or in-lb. Torque specifications are critical for fastener tightening, power tool selection, and motor sizing in industrial applications.',
    category: 'tools',
    status: 'published',
  },
  {
    term: 'CFM',
    slug: 'cfm',
    full_name: 'Cubic Feet per Minute',
    fullName: 'Cubic Feet per Minute',
    definition:
      'A unit of measurement for air flow volume, commonly used to rate air compressors, pneumatic tools, ventilation systems, and dust collection equipment.',
    category: 'tools',
    status: 'published',
  },
  {
    term: 'RPM',
    slug: 'rpm',
    full_name: 'Revolutions Per Minute',
    fullName: 'Revolutions Per Minute',
    definition:
      'A measure of rotational speed indicating the number of complete turns a rotating object makes per minute. RPM is a key specification for motors, power tools, grinding wheels, drill bits, and rotating machinery.',
    category: 'tools',
    status: 'published',
  },
] as const
