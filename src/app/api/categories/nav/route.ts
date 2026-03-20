import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 静态数据 - 构建时生成，无需数据库连接
// 这避免了冷启动延迟

export async function GET() {
  try {
    // 尝试读取预生成的静态数据
    const dataPath = path.join(process.cwd(), 'public/data/nav-categories.json')
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8')
      return NextResponse.json(JSON.parse(data), {
        headers: { 
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      })
    }
    
    // 如果静态文件不存在，返回空数据
    return NextResponse.json({ categories: [] })
  } catch (error) {
    console.error('Nav categories error:', error)
    return NextResponse.json({ categories: [] })
  }
}