#!/usr/bin/env node

/**
 * Export products from MongoDB to JSON file
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const OUTPUT_FILE = path.join(__dirname, '../supabase/products-export.json');

const FIELD_MAPS = {
  'name': 'name',
  'slug': 'slug',
  'sku': 'sku',
  'status': 'status',
  'shortDescription': 'short_description',
  'fullDescription': 'full_description',
  'purchaseMode': 'purchase_mode',
  'pricing': 'pricing',
  'availability': 'availability',
  'minOrderQuantity': 'min_order_quantity',
  'packageQty': 'package_qty',
  'packageUnit': 'package_unit',
  'weight': 'weight',
  'specifications': 'specifications',
  'faq': 'faq',
  'images': 'images',
  'externalImageUrl': 'external_image_url',
  'additionalImageUrls': 'additional_image_urls',
  'categories': 'categories',
  'tags': 'tags',
  'metaTitle': 'meta_title',
  'metaDescription': 'meta_description',
  'focusKeyword': 'focus_keyword',
  'sourceUrl': 'source_url',
  'shippingInfo': 'shipping_info',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at'
};

async function exportProducts() {
  console.log('🚀 Exporting products from MongoDB...');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const mongo = client.db('machrio');

  const count = await mongo.collection('products').countDocuments();
  console.log(`Found ${count} products`);

  const products = [];
  const cursor = mongo.collection('products').find({});

  let processed = 0;
  for await (const doc of cursor) {
    const record = {
      _id: doc._id.toString(),
      ...doc
    };
    products.push(record);
    processed++;

    if (processed % 500 === 0) {
      process.stdout.write(`\r  Progress: ${processed}/${count}`);
    }
  }

  console.log(`\n  Exported ${products.length} products`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2));
  console.log(`  Saved to ${OUTPUT_FILE}`);

  await client.close();
}

exportProducts().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
