const dns = require('dns').promises;
const https = require('https');
const { Pool } = require('pg');

async function testWithCustomDNS() {
  console.log('🔍 尝试使用自定义 DNS 服务器解析...\n');
  
  const hostname = 'db.yderhgkjcsaqrsfntpqm.supabase.co';
  
  // 尝试不同的 DNS 服务器
  const dnsServers = [
    '8.8.8.8',      // Google DNS
    '1.1.1.1',      // Cloudflare DNS
    '9.9.9.9',      // Quad9 DNS
    '208.67.222.222' // OpenDNS
  ];
  
  for (const dnsServer of dnsServers) {
    try {
      console.log(`  尝试 DNS 服务器：${dnsServer}`);
      
      // 设置自定义 DNS
      dns.setServers([dnsServer]);
      
      // 解析域名
      const addresses = await dns.resolve(hostname);
      console.log(`    ✅ 解析成功：${addresses.join(', ')}`);
      
      // 尝试连接
      console.log(`    尝试连接数据库...`);
      
      const pool = new Pool({
        host: addresses[0],
        port: 5432,
        database: 'postgres',
        user: 'postgres.pnqzjqpryqeqpmdqjhxc',
        password: 'qgvPF1YbGso3swVy',
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        const result = await pool.query('SELECT NOW()');
        console.log(`    ✅ 数据库连接成功！`);
        console.log(`    服务器时间：${result.rows[0].now}`);
        await pool.end();
        return true;
      } catch (err) {
        console.log(`    ❌ 数据库连接失败：${err.message}`);
        await pool.end();
      }
      
    } catch (err) {
      console.log(`    ❌ 解析失败：${err.message}`);
    }
    console.log('');
  }
  
  return false;
}

testWithCustomDNS().then(success => {
  if (success) {
    console.log('\n✅ 成功连接到 Supabase！');
  } else {
    console.log('\n❌ 所有 DNS 服务器都失败');
    console.log('\n💡 建议方案：');
    console.log('   1. 使用 VPN 连接');
    console.log('   2. 使用 HTTP 隧道/代理');
    console.log('   3. 在 Docker 容器中运行（容器可能有不同的 DNS 配置）');
  }
}).catch(console.error);
