import { Pool } from 'pg'

// 为 Vercel Serverless 环境创建新连接池
// 注意：在 Serverless 环境中，全局变量可能不可靠
export function createPool(): Pool {
  console.log('[createPool] DATABASE_URI exists:', !!process.env.DATABASE_URI)
  console.log('[createPool] USE_POSTGRES:', process.env.USE_POSTGRES)
  return new Pool({
    connectionString: process.env.DATABASE_URI,
    max: 1, // 只用 1 个连接
    min: 0,
    idleTimeoutMillis: 5000,
  })
}

// 保留旧函数名以兼容
export function getPool(): Pool {
  return createPool()
}

export async function closePool(pool: Pool): Promise<void> {
  await pool.end()
}
