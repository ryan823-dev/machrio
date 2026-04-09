// Restore category descriptions from seed data
// Run with: npx tsx scripts/restore-category-descriptions.ts

import { getPayload } from 'payload';
import config from '../src/payload/payload.config';

// Category descriptions from seed.ts
const categoryData = [
  {
    slug: 'adhesives-sealants-tape',
    name: 'Adhesives & Sealants & Tape',
    description: 'Industrial adhesives, sealants, and tapes for bonding, sealing, insulating, and waterproofing in manufacturing, construction, and maintenance applications.',
    shortDescription: 'Bonding, sealing, and taping solutions for industrial use',
  },
  {
    slug: 'material-handling',
    name: 'Material Handling',
    description: 'Material handling equipment including hand trucks, platform carts, pallet jacks, shelving, lifting equipment, and storage solutions for warehouse and industrial facilities.',
    shortDescription: 'Carts, trucks, lifts, and storage for warehouse operations',
  },
  {
    slug: 'safety',
    name: 'Safety',
    description: 'Personal Protective Equipment (PPE) and safety supplies including gloves, eyewear, hearing protection, hard hats, high-visibility apparel, respiratory protection, and fall arrest systems.',
    shortDescription: 'PPE and safety supplies for industrial workplaces',
  },
  {
    slug: 'packaging-shipping',
    name: 'Packaging & Shipping',
    description: 'Packaging materials and shipping supplies including boxes, bubble wrap, stretch film, packing tape, labels, void fill, and protective packaging for safe product transit.',
    shortDescription: 'Boxes, wrap, tape, and protective packaging supplies',
  },
  {
    slug: 'cleaning-janitorial',
    name: 'Cleaning and Janitorial',
    description: 'Commercial and industrial cleaning supplies, janitorial equipment, degreasers, disinfectants, mops, brooms, trash bags, paper products, and facility maintenance products.',
    shortDescription: 'Industrial cleaning and facility maintenance supplies',
  },
  {
    slug: 'lighting',
    name: 'Lighting',
    description: 'Industrial and commercial lighting solutions including LED high-bay fixtures, work lights, emergency lighting, outdoor flood lights, and task lighting for warehouses and factories.',
    shortDescription: 'LED, high-bay, work, and emergency lighting',
  },
  {
    slug: 'power-transmission',
    name: 'Power Transmission',
    description: 'Power transmission components including bearings, belts, chains, couplings, gears, pulleys, sprockets, and related hardware for industrial machinery and equipment.',
    shortDescription: 'Bearings, belts, chains, gears, and couplings',
  },
  {
    slug: 'tool-storage-workbenches',
    name: 'Tool Storage & Workbenches',
    description: 'Tool storage solutions and workbenches including rolling cabinets, stationary chests, wall-mounted organizers, heavy-duty workbenches, and modular storage systems.',
    shortDescription: 'Cabinets, workbenches, and tool organization',
  },
  {
    slug: 'plumbing-pumps',
    name: 'Plumbing & Pumps',
    description: 'Plumbing supplies and pump equipment including pipes, fittings, valves, water pumps, sump pumps, chemical pumps, hoses, clamps, and pipe thread sealant.',
    shortDescription: 'Pipes, fittings, valves, and pump equipment',
  },
];

// Convert plain text to Lexical rich text format
const richText = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal',
            text,
            type: 'text',
            format: 0,
            style: '',
            detail: 0,
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        textFormat: 0,
        textStyle: '',
      },
    ],
    direction: 'ltr' as const,
  },
});

async function restoreCategoryDescriptions() {
  console.log('🚀 Starting category description restoration...\n');
  
  try {
    const payload = await getPayload({ config });
    
    let updated = 0;
    let notFound = 0;
    
    for (const categoryData of categoryData) {
      // Find category by slug
      const existing = await payload.find({
        collection: 'categories',
        where: { slug: { equals: categoryData.slug } },
        limit: 1,
      });
      
      if (existing.docs.length > 0) {
        const category = existing.docs[0];
        
        // Update with description and short_description
        await payload.update({
          collection: 'categories',
          id: category.id,
          data: {
            description: richText(categoryData.description),
            shortDescription: categoryData.shortDescription,
          },
        });
        
        console.log(`✅ Updated: ${categoryData.name}`);
        updated++;
      } else {
        console.log(`❌ Not found: ${categoryData.name} (slug: ${categoryData.slug})`);
        notFound++;
      }
    }
    
    console.log('\n🎉 Restoration complete!');
    console.log(`   Updated: ${updated} categories`);
    console.log(`   Not found: ${notFound} categories`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

restoreCategoryDescriptions();
