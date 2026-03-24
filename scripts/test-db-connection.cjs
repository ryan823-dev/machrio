#!/usr/bin/env node
/**
 * 数据库连接测试工具
 * 
 * 自动检测可用的数据库连接方式：
 * 1. Supabase 直连（PostgreSQL）
 * 2. Supabase REST API
 * 3. MongoDB（本地备用）
 */

const https = require('https');
const { MongoClient } = require('mongodb');

const CONFIG = {
  supabase: {
    host: 'db.yderhgkjcsaqrsfntpqm.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres.pnqzjqpryqeqpmdqjhxc',
    password: 'qgvPF1YbGso3swVy',
    restUrl: 'https://yderhgkjcsaqrsfntpqm.supabase.co/rest/v1',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM'
  },
  mongo: {
    uri: 'mongodb+srv://mroworks_db_user:moore1982@mroworks-dev.gbqxebq.mongodb.net/machrio'
  }
};

async function testSupabaseDirect() {
  console.log('🔍 测试 Supabase 直连...');
  
  return new Promise((resolve) => {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: CONFIG.supabase.host,
      port: CONFIG.supabase.port,
      database: CONFIG.supabase.database,
      user: CONFIG.supabase.user,
      password: CONFIG.supabase.password,
      ssl: { rejectUnauthorized: false }
    });

    const timeout = setTimeout(() => {
      console.log('   ⏱️  连接超时（30 秒）');
      pool.end();
      resolve(false);
    }, 30000);

    pool.query('SELECT NOW()', (err, res) => {
      clearTimeout(timeout);
      if (err) {
        console.log(`   ❌ 失败：${err.message}`);
        console.log(`      错误代码：${err.code}`);
        pool.end();
        resolve(false);
      } else {
        console.log('   ✅ 成功！');
        console.log(`      服务器时间：${res.rows[0].now}`);
        pool.end();
        resolve(true);
      }
    });
  });
}

async function testSupabaseRest() {
  console.log('\n🔍 测试 Supabase REST API...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'yderhgkjcsaqrsfntpqm.supabase.co',
      path: '/rest/v1/products?select=id,sku&limit=1',
      method: 'GET',
      headers: {
        'apikey': CONFIG.supabase.serviceKey,
        'Authorization': 'Bearer ' + CONFIG.supabase.serviceKey
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ 成功！');
          try {
            const data = JSON.parse(body);
            console.log(`      获取到 ${data.length} 条产品记录`);
            resolve(true);
          } catch (e) {
            console.log('   ⚠️  响应解析失败');
            resolve(false);
          }
        } else {
          console.log(`   ❌ 失败：HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', err => {
      console.log(`   ❌ 失败：${err.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log('   ⏱️  请求超时（10 秒）');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testMongoDB() {
  console.log('\n🔍 测试 MongoDB 连接...');
  
  const client = new MongoClient(CONFIG.mongo.uri);
  
  try {
    await client.connect();
    const db = client.db('machrio');
    const count = await db.collection('products').countDocuments();
    
    console.log('   ✅ 成功！');
    console.log(`      产品数量：${count}`);
    
    await client.close();
    return true;
  } catch (err) {
    console.log(`   ❌ 失败：${err.message}`);
    await client.close();
    return false;
  }
}

async function main() {
  console.log('📊 数据库连接测试工具\n');
  console.log('='.repeat(50));
  
  const results = {
    supabaseDirect: await testSupabaseDirect(),
    supabaseRest: await testSupabaseRest(),
    mongo: await testMongoDB()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 测试结果汇总\n');
  
  console.log(`Supabase 直连：     ${results.supabaseDirect ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`Supabase REST API: ${results.supabaseRest ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`MongoDB:          ${results.mongo ? '✅ 可用' : '❌ 不可用'}`);
  
  console.log('\n💡 建议配置：');
  
  if (results.supabaseDirect) {
    console.log('   使用 Supabase 直连模式（最佳性能）');
    console.log('   USE_POSTGRES=1');
  } else if (results.supabaseRest) {
    console.log('   使用 MongoDB 作为本地开发数据库');
    console.log('   生产部署使用 Supabase');
    console.log('   USE_POSTGRES=0（本地）');
  } else if (results.mongo) {
    console.log('   仅使用 MongoDB（离线开发模式）');
    console.log('   USE_POSTGRES=0');
  } else {
    console.log('   ⚠️  所有数据库连接都不可用，请检查网络');
  }
  
  console.log('\n' + '='.repeat(50));
}

main().catch(console.error);
