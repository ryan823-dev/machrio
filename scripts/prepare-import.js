#!/usr/bin/env node

// Simple content import script that creates JSON files for manual CMS import
// This creates ready-to-import files that can be used in Payload Admin Panel

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createImportReadyFiles() {
  console.log('🚀 Preparing content for CMS import...\n');
  
  // Articles to prepare
  const articles = [
    'mro-what-is-mro.json',
    'mro-what-are-products.json', 
    'respirators-types-explained.json'
  ];
  
  const prepared = [];
  
  // Create import-ready directory
  const importDir = path.join(__dirname, 'import-ready');
  if (!fs.existsSync(importDir)) {
    fs.mkdirSync(importDir, { recursive: true });
  }
  
  for (const fileName of articles) {
    try {
      const sourcePath = path.join(__dirname, 'content', fileName);
      
      if (!fs.existsSync(sourcePath)) {
        console.log(`❌ Source file not found: ${fileName}`);
        continue;
      }
      
      const articleData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      console.log(`📄 Preparing: ${articleData.title}`);
      
      // Create simplified import format
      const importData = {
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt,
        category: articleData.category,
        tags: articleData.tags || [],
        author: articleData.author || 'Machrio Team',
        status: articleData.status || 'draft',
        seo: {
          metaTitle: articleData.seo?.metaTitle || articleData.title,
          metaDescription: articleData.seo?.metaDescription || articleData.excerpt
        }
      };
      
      // Save import-ready file
      const outputPath = path.join(importDir, fileName);
      fs.writeFileSync(outputPath, JSON.stringify(importData, null, 2));
      
      console.log(`   ✅ Prepared: ${outputPath}`);
      
      prepared.push({
        title: articleData.title,
        slug: articleData.slug,
        file: outputPath
      });
      
    } catch (error) {
      console.log(`❌ Failed to prepare ${fileName}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📊 Preparation Summary:');
  console.log(`✅ Successfully prepared: ${prepared.length}`);
  
  if (prepared.length > 0) {
    console.log('\n_PREPARED FILES:_');
    prepared.forEach(item => {
      console.log(`• ${item.title}`);
      console.log(`  File: ${item.file}`);
      console.log(`  Slug: ${item.slug}`);
    });
  }
  
  console.log('\n📝 Manual Import Instructions:');
  console.log('1. Visit: http://localhost:3000/admin');
  console.log('2. Login to Payload Admin Panel');
  console.log('3. Navigate to Articles collection');
  console.log('4. Click "Create New"');
  console.log('5. Copy data from import-ready JSON files:');
  
  prepared.forEach((item, index) => {
    console.log(`   ${index + 1}. Open ${item.file}`);
    console.log(`   2. Copy the JSON content`);
    console.log(`   3. Paste into the article form fields`);
  });
  
  console.log('\n📁 Import-ready files location:');
  console.log(importDir);
}

// Run the preparation
createImportReadyFiles();