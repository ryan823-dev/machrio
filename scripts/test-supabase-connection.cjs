const https = require('https');

const SUPABASE_URL = 'yderhgkjcsaqrsfntpqm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM';

// Test REST API connection
function testRestApi() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/products?select=id,sku&limit=1',
      method: 'GET',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY
      }
    };

    https.get(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ REST API 连接成功');
          try {
            const data = JSON.parse(body);
            console.log(`   获取到 ${data.length} 条产品记录`);
            resolve(true);
          } catch (e) {
            console.log('   解析响应失败:', e.message);
            resolve(false);
          }
        } else {
          console.log(`❌ REST API 连接失败：HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', err => {
      console.log('❌ REST API 连接错误:', err.message);
      resolve(false);
    });
  });
}

testRestApi().then(success => {
  if (success) {
    console.log('\n💡 建议：使用 REST API 模式连接 Supabase');
    console.log('   本地开发可以使用 MongoDB（数据已同步）');
    console.log('   生产环境使用 Supabase REST API');
  }
});
