const { Pool } = require('pg');

// Supabase 连接配置
const configs = [
  {
    name: '直连主数据库（端口 5432）',
    config: {
      host: 'db.yderhgkjcsaqrsfntpqm.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres.pnqzjqpryqeqpmdqjhxc',
      password: 'qgvPF1YbGso3swVy',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: '连接池端点（端口 6543）',
    config: {
      host: 'aws-0-ap-southeast-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.pnqzjqpryqeqpmdqjhxc',
      password: 'qgvPF1YbGso3swVy',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: '使用 IP 地址直连',
    config: {
      host: '104.18.38.10',
      port: 5432,
      database: 'postgres',
      user: 'postgres.pnqzjqpryqeqpmdqjhxc',
      password: 'qgvPF1YbGso3swVy',
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: '使用 IP 地址 + 连接池',
    config: {
      host: '104.18.38.10',
      port: 6543,
      database: 'postgres',
      user: 'postgres.pnqzjqpryqeqpmdqjhxc',
      password: 'qgvPF1YbGso3swVy',
      ssl: { rejectUnauthorized: false }
    }
  }
];

async function testConnection(name, config) {
  console.log(`\n🔍 测试：${name}`);
  
  return new Promise((resolve) => {
    const pool = new Pool(config);
    
    const timeout = setTimeout(() => {
      console.log('   ⏱️  超时（15 秒）');
      pool.end();
      resolve(false);
    }, 15000);
    
    pool.query('SELECT NOW()', (err, res) => {
      clearTimeout(timeout);
      if (err) {
        console.log(`   ❌ 失败：${err.message.substring(0, 60)}`);
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

async function main() {
  console.log('🚀 Supabase 100% 迁移 - 连接测试');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const { name, config } of configs) {
    const success = await testConnection(name, config);
    results.push({ name, success });
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总\n');
  
  const successCount = results.filter(r => r.success).length;
  
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });
  
  console.log(`\n成功：${successCount}/${configs.length}`);
  
  if (successCount > 0) {
    console.log('\n💡 建议：使用第一个成功的连接方式');
  } else {
    console.log('\n⚠️  所有直连方式都失败，需要使用代理或隧道');
  }
}

main().catch(console.error);
