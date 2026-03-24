/**
 * Supabase HTTP Adapter
 * 
 * 通过 Supabase REST API 模拟 PostgreSQL 连接
 * 用于解决本地网络无法直连数据库的问题
 */

const https = require('https');
const crypto = require('crypto');

class SupabaseHttpAdapter {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://yderhgkjcsaqrsfntpqm.supabase.co';
    this.serviceKey = config.serviceKey;
    this.schema = config.schema || 'public';
  }

  // 生成 UUID
  generateId() {
    const hash = crypto.createHash('sha256').update(Date.now().toString() + Math.random()).digest();
    const bytes = Buffer.from(hash.slice(0, 16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20,32)].join('-');
  }

  // HTTP 请求
  request(method, table, data = null, query = {}) {
    return new Promise((resolve, reject) => {
      const queryString = Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      
      const path = `/rest/v1/${table}${queryString ? '?' + queryString : ''}`;
      
      const options = {
        hostname: this.baseUrl.replace('https://', ''),
        path,
        method,
        headers: {
          'apikey': this.serviceKey,
          'Authorization': `Bearer ${this.serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      };

      const req = https.request(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body || '[]'));
            } catch {
              resolve(body ? { text: body } : null);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 100)}`));
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

  // 模拟 query 方法
  async query(sql, params) {
    // 解析 SQL 并转换为 REST API 调用
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('select now()')) {
      return { rows: [{ now: new Date().toISOString() }] };
    }
    
    if (sqlLower.startsWith('select') && sqlLower.includes('from')) {
      // 解析表名
      const match = sqlLower.match(/from\s+(\w+)/);
      if (match) {
        const table = match[1];
        const result = await this.request('GET', table);
        return { rows: Array.isArray(result) ? result : [result] };
      }
    }
    
    // 默认返回空结果
    return { rows: [] };
  }

  // 连接方法
  async connect() {
    console.log('🔗 连接到 Supabase HTTP Adapter...');
    try {
      // 测试连接
      await this.request('GET', 'products', null, { limit: '1' });
      console.log('✅ Supabase HTTP Adapter 连接成功');
      return this;
    } catch (err) {
      console.error('❌ Supabase HTTP Adapter 连接失败:', err.message);
      throw err;
    }
  }

  async end() {
    console.log('🔌 Supabase HTTP Adapter 连接已关闭');
  }
}

// 创建适配器实例
function createSupabaseHttpAdapter(config) {
  const adapter = new SupabaseHttpAdapter({
    baseUrl: 'https://yderhgkjcsaqrsfntpqm.supabase.co',
    serviceKey: config.serviceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZXJoZ2tqY3NhcXJzZm50cHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI0NDU3MiwiZXhwIjoyMDg5ODIwNTcyfQ.aX9EPl9c9NXZ2fUZ1oJSxtTeak67Y8w4cPO97EooaQM'
  });
  
  return adapter;
}

// 测试
if (require.main === module) {
  (async () => {
    const adapter = createSupabaseHttpAdapter({});
    await adapter.connect();
    
    const result = await adapter.query('SELECT NOW()');
    console.log('查询结果:', result);
    
    await adapter.end();
  })();
}

module.exports = { SupabaseHttpAdapter, createSupabaseHttpAdapter };
