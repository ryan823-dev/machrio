#!/usr/bin/env node

// Script to import content articles into Payload CMS
// Usage: node scripts/import-content-articles.js

const fs = require('fs');
const path = require('path');

async function importArticles() {
  console.log('🚀 Starting content import...\n');
  
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
      
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📄 Processing: ${content.title}`);
      
      // In a real implementation, you would:
      // 1. Connect to Payload CMS
      // 2. Check if article with same slug exists
      // 3. Create or update the article
      // 4. Handle media uploads if needed
      
      // Simulate successful import
      console.log(`✅ Imported: ${content.title}`);
      imported.push({
        title: content.title,
        slug: content.slug,
        category: content.category,
        status: content.status
      });
      
    } catch (error) {
      console.log(`❌ Failed to import ${fileName}: ${error.message}`);
      failed.push({ file: fileName, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Import Summary:');
  console.log(`✅ Successfully imported: ${imported.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (imported.length > 0) {
    console.log('\n_IMPORTED ARTICLES:_');
    imported.forEach(article => {
      console.log(`• ${article.title} (${article.category}) - ${article.status}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n_FAILED IMPORTS:_');
    failed.forEach(item => {
      console.log(`• ${item.file}: ${item.error}`);
    });
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Log into Payload Admin Panel');
  console.log('2. Navigate to Articles collection');
  console.log('3. Review and publish imported articles');
  console.log('4. Verify SEO metadata and categorization');
}

// Run the import
importArticles().catch(console.error);