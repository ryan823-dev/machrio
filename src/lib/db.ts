import { Pool } from 'pg'

// 全局连接池 - Vercel Serverless 环境使用 globalThis 持久化
let globalPool: Pool | null = null

function getGlobalPool(): Pool {
  // 在开发环境使用普通全局变量
  if (process.env.NODE_ENV === 'development') {
    if (!globalPool) {
      globalPool = createPool()
    }
    return globalPool
  }

  // 在生产环境使用 globalThis 跨请求持久化
  if (!(globalThis as Record<string, unknown>).__payloadPool) {
    (globalThis as Record<string, unknown>).__payloadPool = createPool()
  }
  return (globalThis as Record<string, unknown>).__payloadPool as Pool
}

// 创建连接池
function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 5,  // 增加到 5 个连接
    min: 1,  // 保持至少 1 个连接
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  })
}

// 兼容旧函数名
export function getPool(): Pool {
  return getGlobalPool()
}

export async function closePool(pool: Pool): Promise<void> {
  // 不再关闭全局池，让它复用
  // await pool.end()
}
