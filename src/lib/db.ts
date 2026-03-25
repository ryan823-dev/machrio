import { Pool } from 'pg'

// 全局数据库连接池 - 避免每次创建新连接
let globalPool: Pool | null = null

export function getPool(): Pool {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: process.env.DATABASE_URI,
      max: 2, // 最多 2 个连接
      min: 0, // 最小 0 个空闲连接
      idleTimeoutMillis: 10000, // 10 秒空闲超时
    })
  }
  return globalPool
}

export async function closePool(): Promise<void> {
  if (globalPool) {
    await globalPool.end()
    globalPool = null
  }
}
