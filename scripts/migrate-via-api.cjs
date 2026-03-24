#!/usr/bin/env node

/**
 * MongoDB to Supabase PostgreSQL 迁移脚本
 * 使用 Supabase REST API 迁移数据
 *
 * 使用方法:
 *   node scripts/migrate-via-api.js
 */

const https = require('https');

// 配置
const SUPABASE_URL = 'https://bslytwwngebusnwqqend.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbHl0d3duZ2VidXNud3FxZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAwMjMxNiwiZXhwIjoyMDg5NTc4MzE2fQ.CoZSueMSBg-kLlKa3F5dK-SJKhRXESsx8e1VONkyL44';
const BACKUP_DIR = '/Users/oceanlink/Documents/Qoder-1/backup/mongodb-export';

// REST API 请求函数
function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          if (res.statusCode >= 400) {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(result)}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 迁移表列表 - 保留 _id 作为主键
const tables = [
  { name: 'categories', backupFile: 'categories.json', idField: '_id', skipDeleteId: true },
  { name: 'products', backupFile: 'products.json', idField: '_id', skipDeleteId: true },
  { name: 'articles', backupFile: 'articles.json', idField: '_id', skipDeleteId: true }
];

async function migrateTable(tableName, records) {
  console.log(`\n迁移 ${tableName}... 共 ${records.length} 条`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    try {
      // 清理 MongoDB 特殊字段，保留 _id
      const cleanRecord = { ...record };
      delete cleanRecord.__v;

      // 通过 POST 插入
      await apiRequest('POST', `/rest/v1/${tableName}`, cleanRecord);
      successCount++;
    } catch (err) {
      errorCount++;
      if (errorCount <= 3) {
        console.log(`  错误: ${err.message.substring(0, 100)}`);
      }
    }
  }

  console.log(`  ✅ 成功: ${successCount}, ❌ 失败: ${errorCount}`);
  return { success: successCount, errors: errorCount };
}

async function main() {
  console.log('🚀 MongoDB to Supabase 迁移 (REST API 模式)');
  console.log('='.repeat(50));

  // 测试连接
  console.log('\n1️⃣  测试 Supabase 连接...');
  try {
    const test = await apiRequest('GET', '/rest/v1/categories?select=_id&limit=1');
    console.log('✅ Supabase REST API 连接成功');
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
    process.exit(1);
  }

  // 读取备份文件
  console.log('\n2️⃣  读取 MongoDB 备份...');
  const fs = require('fs');

  for (const table of tables) {
    const filePath = `${BACKUP_DIR}/${table.backupFile}`;
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const records = JSON.parse(data);
        table.records = records;
        table.fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
        console.log(`  ✅ ${table.name}: ${records.length} 条 (${table.fileSize} MB)`);
      } catch (err) {
        console.log(`  ❌ ${table.name}: 读取失败 - ${err.message}`);
        table.records = [];
      }
    } else {
      console.log(`  ⚠️  ${table.name}: 文件不存在`);
      table.records = [];
    }
  }

  // 执行迁移
  console.log('\n3️⃣  开始迁移数据...');
  let totalSuccess = 0;
  let totalErrors = 0;

  for (const table of tables) {
    if (table.records.length > 0) {
      const result = await migrateTable(table.name, table.records);
      totalSuccess += result.success;
      totalErrors += result.errors;
    }
  }

  // 验证结果
  console.log('\n4️⃣  验证迁移结果...');
  for (const table of tables) {
    try {
      const count = await apiRequest('GET', `/rest/v1/${table.name}?select=id`);
      console.log(`  ${table.name}: ${Array.isArray(count) ? count.length : '?'} 条`);
    } catch (err) {
      console.log(`  ${table.name}: 验证失败`);
    }
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 迁移完成:');
  console.log(`  ✅ 成功: ${totalSuccess} 条`);
  console.log(`  ❌ 失败: ${totalErrors} 条`);
  console.log('\n🎉 迁移完成!');
}

main().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});
