// Create subcategories for MROworks
// Run with: node scripts/create-subcategories.cjs
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority&appName=mroworks-dev';

// Lexical richText helper
function richText(text) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [{
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{
          mode: 'normal',
          text,
          type: 'text',
          format: 0,
          style: '',
          detail: 0,
          version: 1,
        }],
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
      }],
      direction: 'ltr',
    },
  };
}

// Subcategory definitions grouped by parent slug
const SUBCATEGORIES = {
  'safety': [
    { name: 'Hand Protection', slug: 'hand-protection', shortDescription: 'Work gloves, disposable gloves, cut-resistant and chemical-resistant hand protection', description: 'Industrial work gloves and hand protection for every application. Disposable nitrile, latex, and vinyl gloves for medical and food service. Cut-resistant, chemical-resistant, and heat-resistant gloves for manufacturing and construction.' },
    { name: 'Eye & Face Protection', slug: 'eye-face-protection', shortDescription: 'Safety glasses, goggles, face shields, and protective eyewear', description: 'Safety eyewear and face protection including safety glasses, goggles, face shields, and welding lenses. ANSI Z87.1 compliant options for impact, splash, and UV protection across industrial environments.' },
    { name: 'Welding Protection', slug: 'welding-protection', shortDescription: 'Welding helmets, auto-darkening hoods, and welding safety gear', description: 'Welding helmets, auto-darkening hoods, handheld welding shields, and welding protection accessories. Various shade ranges for MIG, TIG, and stick welding applications in industrial and fabrication settings.' },
    { name: 'Hearing Protection', slug: 'hearing-protection', shortDescription: 'Earplugs, earmuffs, and noise reduction hearing protection', description: 'Hearing protection including disposable and reusable earplugs, over-the-head earmuffs, and electronic hearing protectors. Multiple NRR ratings for construction, manufacturing, and industrial noise environments.' },
    { name: 'Foot Protection', slug: 'foot-protection', shortDescription: 'Safety boots, rain boots, and protective footwear', description: 'Industrial safety footwear including steel-toe boots, rubber rain boots, PVC hygiene boots, and chemical-resistant footwear for warehouse, construction, and food processing environments.' },
    { name: 'Leg & Body Protection', slug: 'leg-body-protection', shortDescription: 'Leg guards, gaiters, snake-proof protection, and waders', description: 'Leg guards, protective gaiters, snake-bite proof leg protection, and wader gear. Full-grain leather and reinforced materials for outdoor, agricultural, and industrial applications.' },
    { name: 'First Aid & Medical', slug: 'first-aid-medical', shortDescription: 'First aid kits, medical supplies, and emergency response equipment', description: 'Workplace first aid kits, medical supplies, and emergency response equipment. Wall-mounted and portable kits in metal and plastic cases, pre-stocked and customizable for OSHA compliance.' },
    { name: 'Respiratory Protection', slug: 'respiratory-protection', shortDescription: 'Respirators, face masks, and breathing protection', description: 'Respiratory protection including half-face and full-face respirators, N95 masks, and cartridge-based breathing apparatus for dust, fume, and chemical vapor environments.' },
    { name: 'Protective Clothing', slug: 'protective-clothing', shortDescription: 'Coveralls, aprons, vests, and protective workwear', description: 'Industrial protective clothing including disposable coveralls, chemical-resistant aprons, high-visibility vests, and flame-resistant workwear for hazardous work environments.' },
    { name: 'Head Protection', slug: 'head-protection', shortDescription: 'Hard hats, bump caps, and fire helmets', description: 'Head protection including hard hats, bump caps, fire helmets, and forestry helmets. ANSI/ISEA Z89.1 compliant options with various suspension systems for construction, mining, and industrial use.' },
  ],
  'adhesives-sealants-tape': [
    { name: 'Tape', slug: 'tape', shortDescription: 'Industrial tape, duct tape, electrical tape, and specialty tapes', description: 'Industrial tapes including duct tape, electrical tape, masking tape, double-sided tape, packing tape, and specialty tapes for bonding, insulating, sealing, and marking applications.' },
    { name: 'Adhesives & Glue', slug: 'adhesives-glue', shortDescription: 'Industrial adhesives, super glue, epoxy, and bonding agents', description: 'Industrial adhesives and glues including super glue, epoxy, polyurethane, structural adhesives, and specialty bonding agents for metal, plastic, wood, and composite materials.' },
    { name: 'Sealants & Caulk', slug: 'sealants-caulk', shortDescription: 'Silicone sealants, caulk, and waterproof sealing compounds', description: 'Sealants and caulking products including silicone, polyurethane, and acrylic sealants for waterproofing, weatherproofing, and gap-filling in construction and maintenance applications.' },
  ],
  'material-handling': [
    { name: 'Carts & Trucks', slug: 'carts-trucks', shortDescription: 'Hand trucks, platform carts, utility carts, and dollies', description: 'Material handling carts and trucks including hand trucks, platform carts, utility carts, dollies, and pallet trucks for warehouse, factory, and commercial material movement.' },
    { name: 'Slings & Rigging', slug: 'slings-rigging', shortDescription: 'Lifting slings, straps, shackles, and rigging hardware', description: 'Lifting slings and rigging equipment including nylon web slings, wire rope slings, chain slings, lifting straps, shackles, and rigging hardware for overhead lifting operations.' },
    { name: 'Jacks & Lifts', slug: 'jacks-lifts', shortDescription: 'Hydraulic jacks, floor jacks, and lifting equipment', description: 'Jacks and lifting equipment including hydraulic bottle jacks, floor jacks, service jacks, scissor lifts, and mechanical lifting devices for automotive, industrial, and maintenance applications.' },
    { name: 'Hoists & Cranes', slug: 'hoists-cranes', shortDescription: 'Chain hoists, electric hoists, and crane equipment', description: 'Hoists and crane equipment including manual chain hoists, electric hoists, lever hoists, beam trolleys, and crane accessories for overhead lifting in workshops and warehouses.' },
    { name: 'Storage & Shelving', slug: 'storage-shelving', shortDescription: 'Shelving units, storage racks, bins, and cabinets', description: 'Industrial storage and shelving solutions including metal shelving units, pallet racks, storage bins, lockers, and cabinets for warehouse, workshop, and facility organization.' },
  ],
  'power-transmission': [
    { name: 'Bearings', slug: 'bearings', shortDescription: 'Ball bearings, roller bearings, and mounted bearing units', description: 'Power transmission bearings including deep groove ball bearings, roller bearings, thrust bearings, pillow block bearings, and mounted bearing units for industrial machinery and equipment.' },
    { name: 'Belts & Pulleys', slug: 'belts-pulleys', shortDescription: 'V-belts, timing belts, pulleys, and belt drive components', description: 'Power transmission belts and pulleys including V-belts, timing belts, flat belts, variable speed pulleys, and sheaves for industrial drive systems and machinery.' },
    { name: 'Chains & Sprockets', slug: 'chains-sprockets', shortDescription: 'Roller chains, drive chains, sprockets, and chain accessories', description: 'Power transmission chains and sprockets including roller chains, drive chains, leaf chains, sprocket wheels, and chain connecting links for conveyors and industrial machinery.' },
    { name: 'Gears & Gear Drives', slug: 'gears-gear-drives', shortDescription: 'Spur gears, helical gears, bevel gears, and gear drives', description: 'Power transmission gears and gear drives including spur gears, helical gears, bevel gears, worm gears, and complete gear drive units for industrial power transfer applications.' },
  ],
};

async function createSubcategories() {
  console.log('=== Create Subcategories ===\n');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB\n');

  const db = client.db('mroworks');
  const categoriesCol = db.collection('categories');

  // Look up parent category IDs
  const parentSlugs = Object.keys(SUBCATEGORIES);
  const parents = await categoriesCol.find({ slug: { $in: parentSlugs } }).toArray();
  const parentMap = {};
  parents.forEach(p => { parentMap[p.slug] = p._id; });
  
  console.log('Parent categories found:');
  Object.entries(parentMap).forEach(([slug, id]) => console.log(`  ${slug}: ${id}`));

  if (Object.keys(parentMap).length !== parentSlugs.length) {
    const missing = parentSlugs.filter(s => !parentMap[s]);
    console.error('Missing parent categories:', missing);
    await client.close();
    return;
  }

  // Check for existing subcategories and skip them
  const existingSlugs = await categoriesCol.find({
    slug: { $in: Object.values(SUBCATEGORIES).flat().map(s => s.slug) }
  }).toArray();
  const existingSet = new Set(existingSlugs.map(c => c.slug));

  let created = 0;
  let skipped = 0;

  for (const [parentSlug, subcats] of Object.entries(SUBCATEGORIES)) {
    const parentId = parentMap[parentSlug];
    console.log(`\n--- ${parentSlug} (${subcats.length} subcategories) ---`);

    for (let i = 0; i < subcats.length; i++) {
      const sub = subcats[i];
      
      if (existingSet.has(sub.slug)) {
        console.log(`  Skipped (exists): ${sub.name}`);
        skipped++;
        continue;
      }

      await categoriesCol.insertOne({
        name: sub.name,
        slug: sub.slug,
        parent: parentId,
        description: richText(sub.description),
        shortDescription: sub.shortDescription,
        featured: false,
        displayOrder: (i + 1) * 10,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`  Created: ${sub.name} (${sub.slug})`);
      created++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total subcategories in DB: ${await categoriesCol.countDocuments()}`);

  await client.close();
  console.log('\nDone!');
}

createSubcategories().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
