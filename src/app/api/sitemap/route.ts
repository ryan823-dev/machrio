import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pool = getPool()
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'
  
  try {
    // Get all categories
    const categoriesResult = await pool.query(`
      SELECT slug, updated_at
      FROM categories
      WHERE status = 'published'
      ORDER BY level, name
    `)
    
    // Get all published products
    const productsResult = await pool.query(`
      SELECT p.slug, p.updated_at, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.primary_category_id = c.id
      WHERE p.status = 'published' AND c.slug IS NOT NULL
      ORDER BY p.updated_at DESC
    `)
    
    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/search', priority: '0.5', changefreq: 'weekly' },
      { url: '/cart', priority: '0.3', changefreq: 'weekly' },
      { url: '/rfq', priority: '0.6', changefreq: 'weekly' },
      { url: '/account', priority: '0.4', changefreq: 'weekly' },
      { url: '/knowledge-center', priority: '0.7', changefreq: 'weekly' },
    ]
    
    const categories = categoriesResult.rows
    const products = productsResult.rows
    
    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`
    
    // Add static pages
    for (const page of staticPages) {
      const lastmod = new Date().toISOString().split('T')[0]
      xml += `  <url>
    <loc>${serverUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
    }
    
    // Add categories
    for (const cat of categories) {
      const lastmod = cat.updated_at 
        ? new Date(cat.updated_at).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0]
      const priority = cat.slug.includes('-') ? '0.8' : '0.9'
      xml += `  <url>
    <loc>${serverUrl}/category/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
`
    }
    
    // Add products
    for (const product of products) {
      const lastmod = product.updated_at 
        ? new Date(product.updated_at).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0]
      const categorySlug = product.category_slug || 'products'
      xml += `  <url>
    <loc>${serverUrl}/product/${categorySlug}/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
    }
    
    xml += '</urlset>'

    // 注意：不要调用 pool.end()！在 serverless 环境中连接池应该被复用

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    // 不要调用 pool.end()！
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    )
  }
}
