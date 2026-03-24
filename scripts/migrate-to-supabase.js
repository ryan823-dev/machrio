#!/usr/bin/env node

/**
 * MongoDB to Supabase PostgreSQL Migration Script
 *
 * Usage:
 *   node scripts/migrate-to-supabase.js
 *
 * Prerequisites:
 *   1. MongoDB data exported to /backup/mongodb-export/
 *   2. Supabase PostgreSQL project created and accessible
 *   3. DATABASE_URI set in environment
 */

const { MongoClient } = require('mongodb');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGO_URI = 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio';
const BACKUP_DIR = path.join(__dirname, '../backup/mongodb-export');
const COLLECTIONS = ['categories', 'products', 'articles', 'payload-preferences', 'productviews'];

async function getPostgresClient() {
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    throw new Error('DATABASE_URI not set in environment');
  }

  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 60000,
  });
}

async function migrateCollection(pgClient, collectionName) {
  console.log(`\n📦 迁移 ${collectionName}...`);

  const filePath = path.join(BACKUP_DIR, `${collectionName}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  备份文件不存在: ${filePath}`);
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`  读取 ${data.length} 条记录`);

  // Truncate existing data
  await pgClient.query(`TRUNCATE TABLE "${collectionName}" CASCADE`);
  console.log(`  清空现有数据`);

  // Insert data based on collection type
  let inserted = 0;

  for (const doc of data) {
    try {
      // Convert MongoDB _id to id and handle ObjectId
      const payload = {
        id: doc._id?.$oid || doc._id || doc.id,
        ...doc,
      };
      delete payload._id;

      // Generic insert - will need customization per collection
      const columns = Object.keys(payload);
      const values = Object.values(payload);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      await pgClient.query(
        `INSERT INTO "${collectionName}" (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      inserted++;
    } catch (err) {
      console.log(`  ⚠️  插入失败: ${err.message}`);
    }
  }

  console.log(`  ✅ 成功插入 ${inserted}/${data.length} 条记录`);
  return inserted;
}

async function main() {
  console.log('🚀 MongoDB to Supabase PostgreSQL 迁移');
  console.log('='.repeat(50));

  // Test MongoDB connection
  console.log('\n1️⃣  测试 MongoDB 连接...');
  const mongoClient = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
  });

  try {
    await mongoClient.connect();
    console.log('✅ MongoDB 连接成功');
    const db = mongoClient.db('machrio');

    // Check collection counts
    for (const colName of COLLECTIONS) {
      const count = await db.collection(colName).countDocuments();
      console.log(`  ${colName}: ${count} 条`);
    }
  } catch (err) {
    console.error('❌ MongoDB 连接失败:', err.message);
    process.exit(1);
  }

  // Test PostgreSQL connection
  console.log('\n2️⃣  测试 PostgreSQL 连接...');
  let pgClient;
  try {
    pgClient = await getPostgresClient();
    await pgClient.connect();
    console.log('✅ PostgreSQL 连接成功');
    const res = await pgClient.query('SELECT current_database()');
    console.log(`  当前数据库: ${res.rows[0].current_database}`);
  } catch (err) {
    console.error('❌ PostgreSQL 连接失败:', err.message);
    await mongoClient.close();
    process.exit(1);
  }

  // Migration summary
  console.log('\n3️⃣  迁移准备...');
  console.log(`  备份目录: ${BACKUP_DIR}`);
  console.log(`  集合列表: ${COLLECTIONS.join(', ')}`);

  // Confirm before migration
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question('\n⚠️  这将清空 Supabase 中的现有数据并重新导入。继续? (y/N): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'y') {
    console.log('取消迁移');
    await mongoClient.close();
    await pgClient.end();
    process.exit(0);
  }

  // Run migration
  console.log('\n4️⃣  开始迁移...');
  let totalMigrated = 0;

  for (const collectionName of COLLECTIONS) {
    try {
      const count = await migrateCollection(pgClient, collectionName);
      totalMigrated += count;
    } catch (err) {
      console.error(`  ❌ ${collectionName} 迁移失败:`, err.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 迁移汇总:');
  console.log(`  总迁移记录: ${totalMigrated}`);
  console.log('✅ 迁移完成!');

  // Cleanup
  await mongoClient.close();
  await pgClient.end();
}

main().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});
