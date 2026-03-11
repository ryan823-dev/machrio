// Seed articles directly into Payload CMS
// Run with: npx tsx scripts/seed-articles.ts

import { getPayload } from 'payload';
import config from '../src/payload/payload.config';

const articles = [
  {
    title: "What Is MRO in Manufacturing? Definition, Examples, and Product Categories",
    slug: "what-is-mro-in-manufacturing",
    excerpt: "Learn what MRO means in manufacturing, what products count as MRO, and how industrial buyers use MRO supplies to support maintenance, repair, and operations.",
    content: {
      root: {
        children: [
          { type: 'paragraph', children: [{ text: "MRO stands for Maintenance, Repair, and Operations – the essential supplies and services that keep industrial facilities running smoothly." }] }
        ]
      }
    },
    category: "industry-insight",
    tags: ["mro", "manufacturing", "maintenance", "industrial supplies"],
    author: "Machrio Team",
    status: "published",
    publishedAt: new Date().toISOString()
  },
  {
    title: "What Are MRO Products? Categories, Examples, and Buying Tips",
    slug: "what-are-mro-products",
    excerpt: "Discover what MRO products are, which categories they include, and how businesses source industrial MRO supplies for maintenance, repair, and operations.",
    content: {
      root: {
        children: [
          { type: 'paragraph', children: [{ text: "MRO products are the diverse range of supplies, equipment, and materials that keep industrial operations running smoothly." }] }
        ]
      }
    },
    category: "buying-guide",
    tags: ["mro products", "industrial supplies", "maintenance", "procurement"],
    author: "Machrio Team",
    status: "published",
    publishedAt: new Date().toISOString()
  },
  {
    title: "Types of Respirators Explained: N95, Half-Face, Full-Face, PAPR, and Supplied-Air",
    slug: "types-of-respirators-explained",
    excerpt: "Learn about different types of respirators including N95 masks, half-face respirators, full-face respirators, PAPRs, and supplied-air systems for workplace safety.",
    content: {
      root: {
        children: [
          { type: 'paragraph', children: [{ text: "Understanding the different types of respirators is crucial for workplace safety." }] }
        ]
      }
    },
    category: "industry-insight",
    tags: ["respirators", "safety equipment", "ppe", "occupational health"],
    author: "Machrio Team",
    status: "published",
    publishedAt: new Date().toISOString()
  }
];

async function seedArticles() {
  console.log('🚀 Starting article seeding...\n');
  
  try {
    const payload = await getPayload({ config });
    
    for (const article of articles) {
      const existing = await payload.find({
        collection: 'articles',
        where: { slug: { equals: article.slug } },
        limit: 1,
      });
      
      if (existing.docs.length > 0) {
        console.log(`⚠️  Updating: ${article.title}`);
        await payload.update({
          collection: 'articles',
          id: existing.docs[0].id,
          data: article,
        });
        console.log(`✅ Updated: ${article.slug}\n`);
      } else {
        console.log(`📄 Creating: ${article.title}`);
        await payload.create({
          collection: 'articles',
          data: article,
        });
        console.log(`✅ Created: ${article.slug}\n`);
      }
    }
    
    console.log('🎉 All articles seeded successfully!');
    console.log('\n📍 Published URLs:');
    articles.forEach(a => console.log(`   /knowledge-center/${a.slug}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedArticles();
