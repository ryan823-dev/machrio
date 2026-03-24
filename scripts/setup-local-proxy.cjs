const http = require('http');
const https = require('https');
const { URL } = require('url');

const SUPABASE_HOST = 'db.yderhgkjcsaqrsfntpqm.supabase.co';
const SUPABASE_PORT = 5432;
const LOCAL_PORT = 5433;

console.log('🚀 启动 Supabase 本地代理服务器');
console.log(`   转发：localhost:${LOCAL_PORT} -> ${SUPABASE_HOST}:${SUPABASE_PORT}`);
console.log('\n⚠️  注意：这个代理需要能够解析 Supabase 域名');
console.log('   如果在容器或特殊网络环境运行，可能可以绕过本地 DNS 限制\n');

const server = http.createServer((req, res) => {
  if (req.method === 'CONNECT') {
    // WebSocket/SSL 隧道
    const url = new URL(`https://${req.url}`);
    const proxyReq = https.request({
      host: url.hostname,
      port: url.port || 443,
      method: req.method,
      headers: req.headers
    });
    
    proxyReq.on('connect', () => {
      req.socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      req.socket.pipe(proxyReq.socket);
      proxyReq.socket.pipe(req.socket);
    });
    
    proxyReq.on('error', err => {
      console.error('代理错误:', err.message);
      res.end();
    });
    
    proxyReq.end();
  } else {
    res.writeHead(400);
    res.end('Only CONNECT method supported');
  }
});

server.listen(LOCAL_PORT, () => {
  console.log(`✅ 代理服务器运行在 http://localhost:${LOCAL_PORT}`);
  console.log(`   连接字符串：postgresql://user:pass@localhost:${LOCAL_PORT}/postgres`);
});
