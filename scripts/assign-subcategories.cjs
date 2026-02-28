// Assign products to subcategories based on keyword matching
// Run with: node scripts/assign-subcategories.cjs
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://mroworks_db_user:SAEvhA4d4A2pzlMX@mroworks-dev.gbqxebq.mongodb.net/mroworks?retryWrites=true&w=majority&appName=mroworks-dev';

// Keyword mappings: subcategory slug → keywords (checked in order, first match wins)
// More specific keywords listed first within each parent group

const SAFETY_KEYWORDS = [
  { slug: 'welding-protection', keywords: ['welding helmet', 'welding mask', 'welding shield', 'welding protection', 'auto darkening', 'auto-darkening', 'shade 8', 'shade 9', 'shade 4', 'shade 5', 'shade 7', 'welding'] },
  { slug: 'first-aid-medical', keywords: ['first aid', 'first-aid', 'medical kit', 'bandage', 'emergency kit'] },
  { slug: 'hearing-protection', keywords: ['earplug', 'earmuff', 'ear plug', 'ear muff', 'hearing protection', 'noise reduction', 'noise cancell'] },
  { slug: 'foot-protection', keywords: ['rain boot', 'hygiene boot', 'pvc boot', 'rubber boot', 'safety boot', 'safety shoe', 'steel toe', 'calf boot'] },
  { slug: 'leg-body-protection', keywords: ['leg guard', 'gaiter', 'snake bite', 'snake proof', 'snakebite', 'snake-bite', 'wader', 'leg protection', 'legging', 'foot cover', 'puncture proof leg'] },
  { slug: 'respiratory-protection', keywords: ['respirator', 'breathing apparatus', 'gas mask', 'air purif'] },
  { slug: 'protective-clothing', keywords: ['coverall', 'apron', 'protective clothing', 'hi-vis', 'high visibility', 'flame resistant'] },
  { slug: 'head-protection', keywords: ['hard hat', 'fire helmet', 'bump cap', 'rescue helmet', 'training helmet', 'firefight'] },
  { slug: 'eye-face-protection', keywords: ['face shield', 'safety glass', 'goggle', 'eye protection', 'polycarbonate visor'] },
  { slug: 'hand-protection', keywords: ['glove', 'gloves', 'nitrile', 'latex exam', 'examination glove', 'hand protection'] },
];

const ADHESIVES_KEYWORDS = [
  { slug: 'adhesives-glue', keywords: ['adhesive', 'glue', 'epoxy', 'super glue', 'bonding agent', 'loctite'] },
  { slug: 'sealants-caulk', keywords: ['sealant', 'caulk', 'silicone seal', 'waterproof seal', 'gasket maker'] },
  // fallback: everything else goes to 'tape'
];

const MATERIAL_HANDLING_KEYWORDS = [
  { slug: 'jacks-lifts', keywords: ['jack', 'hydraulic jack', 'floor jack', 'service jack', 'bottle jack', 'scissor lift', 'lift table'] },
  { slug: 'slings-rigging', keywords: ['sling', 'lifting strap', 'rigging', 'shackle', 'wire rope', 'chain sling', 'web sling', 'nylon sling', 'polyester sling', 'round sling'] },
  { slug: 'hoists-cranes', keywords: ['hoist', 'crane', 'pulley', 'winch', 'block and tackle', 'chain block', 'lever hoist', 'beam trolley', 'beam clamp'] },
  { slug: 'storage-shelving', keywords: ['shelf', 'shelving', 'rack', 'cabinet', 'locker', 'bin', 'storage', 'drawer', 'organizer'] },
  // fallback: everything else goes to 'carts-trucks'
];

const POWER_TRANSMISSION_KEYWORDS = [
  { slug: 'bearings', keywords: ['bearing', 'ball bearing', 'roller bearing', 'pillow block', 'thrust bearing'] },
  { slug: 'belts-pulleys', keywords: ['belt', 'pulley', 'v-belt', 'timing belt', 'sheave', 'belt drive'] },
  { slug: 'chains-sprockets', keywords: ['chain', 'sprocket', 'roller chain', 'drive chain', 'chain link'] },
  // fallback: everything else goes to 'gears-gear-drives'
];

function matchSubcategory(productName, keywordGroups, fallbackSlug) {
  const nameLower = productName.toLowerCase();
  for (const group of keywordGroups) {
    for (const keyword of group.keywords) {
      if (nameLower.includes(keyword)) {
        return group.slug;
      }
    }
  }
  return fallbackSlug;
}

async function assignProducts() {
  console.log('=== Assign Products to Subcategories ===\n');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB\n');

  const db = client.db('mroworks');
  const categoriesCol = db.collection('categories');
  const productsCol = db.collection('products');

  // Build category slug → _id map
  const allCategories = await categoriesCol.find({}).toArray();
  const catMap = {};
  allCategories.forEach(c => { catMap[c.slug] = c._id; });

  // Build parent _id → slug map
  const parentIdToSlug = {};
  allCategories.forEach(c => {
    if (!c.parent) parentIdToSlug[c._id.toString()] = c.slug;
  });

  console.log(`Categories loaded: ${allCategories.length}`);
  console.log(`Parent categories: ${Object.keys(parentIdToSlug).length}\n`);

  // Get all products
  const products = await productsCol.find({}).toArray();
  console.log(`Products to process: ${products.length}\n`);

  const bulkOps = [];
  const stats = {};

  for (const product of products) {
    const primaryCatId = product.primaryCategory?.toString();
    const parentSlug = parentIdToSlug[primaryCatId];

    // Only reassign products that are currently in a parent category
    if (!parentSlug) continue;

    let subcategorySlug;

    if (parentSlug === 'safety') {
      subcategorySlug = matchSubcategory(product.name, SAFETY_KEYWORDS, 'hand-protection');
    } else if (parentSlug === 'adhesives-sealants-tape') {
      subcategorySlug = matchSubcategory(product.name, ADHESIVES_KEYWORDS, 'tape');
    } else if (parentSlug === 'material-handling') {
      subcategorySlug = matchSubcategory(product.name, MATERIAL_HANDLING_KEYWORDS, 'carts-trucks');
    } else if (parentSlug === 'power-transmission') {
      subcategorySlug = matchSubcategory(product.name, POWER_TRANSMISSION_KEYWORDS, 'gears-gear-drives');
    } else {
      continue; // Skip products in other parent categories
    }

    const subcategoryId = catMap[subcategorySlug];
    if (!subcategoryId) {
      console.log(`  Warning: subcategory "${subcategorySlug}" not found for product "${product.name}"`);
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { primaryCategory: subcategoryId } }
      }
    });

    stats[subcategorySlug] = (stats[subcategorySlug] || 0) + 1;
  }

  // Execute bulk update
  if (bulkOps.length > 0) {
    const batchSize = 100;
    let totalModified = 0;
    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const batch = bulkOps.slice(i, i + batchSize);
      const result = await productsCol.bulkWrite(batch);
      totalModified += result.modifiedCount;
    }
    console.log(`Updated ${totalModified} products\n`);
  }

  // Print stats
  console.log('=== Products per Subcategory ===');
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  for (const [slug, count] of sortedStats) {
    console.log(`  ${slug}: ${count}`);
  }
  console.log(`  Total reassigned: ${bulkOps.length}`);

  // Verify: count products per parent (should be ~0 since all moved to subcategories)
  console.log('\n=== Verification: Products remaining in parent categories ===');
  for (const [slug, id] of Object.entries(catMap)) {
    if (parentIdToSlug[id?.toString()]) {
      const count = await productsCol.countDocuments({ primaryCategory: id });
      console.log(`  ${slug}: ${count} products`);
    }
  }

  await client.close();
  console.log('\nDone!');
}

assignProducts().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
