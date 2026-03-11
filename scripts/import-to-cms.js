#!/usr/bin/env node

// Direct Payload CMS content import script
// This script imports content articles directly into the database

import fs from 'fs';
import path from 'path';
import { getPayload } from 'payload';
import config from '../src/payload/payload.config';

async function importContentToCMS() {
  console.log('🚀 Starting direct CMS content import...\n');
  
  // Initialize Payload
  const payload = await getPayload({ config });
  
  // Articles to import
  const articles = [
    'mro-what-is-mro.json',
    'mro-what-are-products.json', 
    'respirators-types-explained.json'
  ];
  
  const imported = [];
  const failed = [];
  
  for (const fileName of articles) {
    try {
      const filePath = path.join(__dirname, 'content', fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${fileName}`);
        failed.push({ file: fileName, error: 'File not found' });
        continue;
      }
      
      const articleData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📄 Processing: ${articleData.title}`);
      
      // Check if article already exists
      const existing = await payload.find({
        collection: 'articles',
        where: {
          slug: { equals: articleData.slug }
        },
        limit: 1
      });
      
      let result;
      
      if (existing.docs.length > 0) {
        // Update existing article
        console.log(`   ⚠️  Article exists, updating...`);
        result = await payload.update({
          collection: 'articles',
          id: existing.docs[0].id,
          data: articleData
        });
        console.log(`   ✅ Updated: ${result.title}`);
      } else {
        // Create new article
        result = await payload.create({
          collection: 'articles',
          data: articleData
        });
        console.log(`   ✅ Created: ${result.title}`);
      }
      
      imported.push({
        title: result.title,
        slug: result.slug,
        category: result.category,
        status: result.status,
        id: result.id
      });
      
    } catch (error) {
      console.log(`❌ Failed to import ${fileName}: ${error.message}`);
      failed.push({ file: fileName, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Import Summary:');
  console.log(`✅ Successfully processed: ${imported.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (imported.length > 0) {
    console.log('\n_IMPORTED ARTICLES:_');
    imported.forEach(article => {
      console.log(`• ${article.title} (${article.category}) - ${article.status}`);
      console.log(`  ID: ${article.id}`);
      console.log(`  URL: /knowledge-center/${article.slug}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n_FAILED IMPORTS:_');
    failed.forEach(item => {
      console.log(`• ${item.file}: ${item.error}`);
    });
  }
  
  console.log('\n📝 Verification steps:');
  console.log('1. Visit: http://localhost:3000/admin');
  console.log('2. Login to Payload Admin Panel');
  console.log('3. Navigate to Articles collection');
  console.log('4. Verify imported articles are visible');
  console.log('5. Check Knowledge Center page: http://localhost:3000/knowledge-center');
  
  // Close Payload connection
  await payload.db.destroy();
}

// Handle command line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
  importContentToCMS()
    .then(() => {
      console.log('\n✨ Import process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import failed:', error);
      process.exit(1);
    });
}

export { importContentToCMS };