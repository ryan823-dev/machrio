/**
 * 初始化数据库 schema
 * 在 API 路由中调用以确保表结构正确
 */

import { getPool } from '@/lib/db';

let initialized = false;

export async function initDatabase(): Promise<void> {
  if (initialized) return;

  const pool = getPool();

  try {
    // Fix users table
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT \'editor\'');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name text');

    // Initialize globals
    await pool.query(`
      INSERT INTO homepage (id, _created_at, _updated_at)
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM homepage)
    `);

    await pool.query(`
      INSERT INTO site_settings (id, _created_at, _updated_at)
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM site_settings)
    `);

    await pool.query(`
      INSERT INTO navigation (id, _created_at, _updated_at)
      SELECT gen_random_uuid(), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM navigation)
    `);

    initialized = true;
    console.log('✅ Database initialized');

  } catch (err) {
    console.error('⚠️  DB init skipped:', (err as Error).message);
  }
  // 注意：不要调用 pool.end()！在 serverless 环境中连接池应该被复用
}