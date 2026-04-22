import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { Client } from 'pg'

function loadEnvironment(): void {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
  loadEnv()
}

function applyReplacements(value: string, replacements: Array<[string, string]>): string {
  return replacements.reduce((current, [from, to]) => current.replaceAll(from, to), value)
}

function normalizeSpecifications(value: string): string {
  const parsed = JSON.parse(value) as Array<Record<string, unknown>>
  const labelMap: Record<string, string> = {
    规格: 'Specification',
    材质: 'Material',
    颜色: 'Color',
    尺寸: 'Dimensions',
    重量: 'Weight',
  }

  const normalized = parsed.map((spec) => {
    const next = { ...spec }

    if (typeof next.label === 'string' && labelMap[next.label]) {
      next.label = labelMap[next.label]
    }

    if (typeof next.value === 'string') {
      if (next.value === '千克') {
        next.value = 'Kilogram'
      } else {
        next.value = next.value.replace(/(\d+(?:\.\d+)?)厘米/g, '$1 cm')
      }
    }

    return next
  })

  return JSON.stringify(normalized)
}

const shortDescriptionReplacements: Record<string, Array<[string, string]>> = {
  YU7658909: [['Chemical-Resistant理化板Worktop', 'Chemical-Resistant Phenolic Resin Worktop']],
  FG4354455: [[
    'Bilingual Display: Features "小心地滑" and "CAUTION SLIPPERY" to alert both Chinese and English speakers.',
    'Bilingual Display: Features Chinese and English warning text, including "CAUTION SLIPPERY", to alert bilingual audiences.',
  ]],
  FG4354454: [[
    'Bilingual Display: Features "当心" and "CAUTION FLOOR SLIPPERY WHEN WET" to alert both Chinese and English speakers.',
    'Bilingual Display: Features Chinese and English warning text, including "CAUTION FLOOR SLIPPERY WHEN WET", to alert bilingual audiences.',
  ]],
  FG4354453: [[
    'Bilingual Display: Features "小心地滑" and "Caution! Wet Floor" to alert both Chinese and English speakers.',
    'Bilingual Display: Features Chinese and English warning text, including "Caution! Wet Floor", to alert bilingual audiences.',
  ]],
  FG4354452: [[
    'Dual-Sided Display: Features "CAUTION WET FLOOR" and "小心地滑" on both sides, ensuring visibility from multiple angles.',
    'Dual-Sided Display: Features Chinese and English wet-floor warning text on both sides, ensuring visibility from multiple angles.',
  ]],
  QW3567841: [['shackle 净高 is 0.83 inches (21mm)', 'shackle clear height is 0.83 inches (21mm)']],
  QW3567840: [['shackle 净高 is 0.87 inches (22mm)', 'shackle clear height is 0.87 inches (22mm)']],
}

const shortDescriptionOverrides: Record<string, string> = {
  QW3567876:
    'Precise Compatibility: Designed for 0.71-inch (18 mm) pin spacing with outward-facing pins on 1P to 4P miniature circuit breakers for a secure fit. Durable Engineering Plastic: Made from PA nylon for heat resistance, corrosion resistance, and shape stability. User-Friendly Design: Easy to install and operate in routine lockout procedures. Prevents Accidental Operation: Helps secure breakers during maintenance to reduce unintended energization. Cost-Effective Solution: An economical lockout option for a wide range of miniature breaker applications.',
  QW3567865:
    'Precise Compatibility: Designed for single-pole circuit breakers with handle thickness up to 0.3 inch (7.7 mm) for a secure fit. Durable Construction: Made from reinforced nylon for long service life in a range of environments. Screwdriver Locking: Uses a screwdriver-tightened design for a dependable hold on the breaker. Versatile Lockout Option: Suitable for multiple breaker-locking scenarios across maintenance tasks. Cost-Effective Solution: An economical choice for breaker lockout programs in budget-sensitive applications.',
  fd34565541:
    'Brand & Model: MENGLI trench-coat-style Oxford cloth raincoat. Universal Fit in Dark Blue: Designed to fit most body types with a dark blue appearance. Oxford Cloth Material: Offers durability and water resistance for dependable rain protection. Long Trench-Coat Style: Provides extended coverage to help keep the body dry in wet weather. Versatile Use: Suitable for daily commuting and a wide range of outdoor activities on rainy days.',
}

const fullDescriptionReplacements: Record<string, Array<[string, string]>> = {
  DJ6798422: [['快拧PE-16', 'Quick-Twist PE-16']],
  DJ6798415: [['SMY-圆三通外丝四分', 'SMY Round Three-Way Male Thread 1/2']],
  DJ6798399: [['304-PP20-快拧公头', '304-PP20 Quick-Twist Male Head']],
  DJ6798368: [['PVC Drainage Straight Coupling (Pipe箍)', 'PVC Drainage Straight Coupling (Pipe Coupling)']],
  DJ6798366: [['PVC Drainage Straight Coupling (Pipe箍)', 'PVC Drainage Straight Coupling (Pipe Coupling)']],
  YU7658971: [['欧式DKJ50-70 male plug', 'European-style DKJ50-70 male plug']],
  YU7658916: [['solid理化板worktop', 'solid phenolic resin worktop']],
  YU7658909: [['The理化板worktop', 'The phenolic resin worktop']],
  FG4354384: [['Lock扣 is steel', 'The hasp body is steel']],
  QW3567790: [['high-temperature实验 apparatus', 'high-temperature experimental apparatus']],
  fd34565552: [['Thickness 4丝', 'Thickness 0.04 mm']],
  JS459500: [['Gande迈 Cleaning Cart', 'Gandemai Cleaning Cart']],
  AA7536989: [['full-textured surface (全麻工艺)', 'full-textured surface finish']],
}

const articleReplacements: Record<string, Array<[string, string]>> = {
  'aerosol-can-recycling-equipment-product-comparison': [[
    'Emergency shutdown联动with ventilation failure',
    'Emergency shutdown interlock with ventilation failure',
  ]],
  'platform-carts-selection-guide': [[
    'Regularly remove debris缠绕',
    'Regularly remove debris buildup and tangles',
  ]],
}

async function updateProductTextField(
  client: Client,
  sku: string,
  field: 'short_description' | 'full_description' | 'specifications',
  transform: (current: string) => string,
): Promise<boolean> {
  const currentResult = await client.query<{ [key: string]: string | null }>(
    `SELECT ${field} FROM products WHERE sku = $1`,
    [sku],
  )

  const current = currentResult.rows[0]?.[field]
  if (!current) {
    return false
  }

  const next = transform(current)
  if (next === current) {
    return false
  }

  await client.query(`UPDATE products SET ${field} = $2 WHERE sku = $1`, [sku, next])
  return true
}

async function updateArticleContent(
  client: Client,
  slug: string,
  replacements: Array<[string, string]>,
): Promise<boolean> {
  const currentResult = await client.query<{ content: unknown }>(
    'SELECT content FROM articles WHERE slug = $1',
    [slug],
  )

  const current = currentResult.rows[0]?.content
  if (!current) {
    return false
  }

  const next = JSON.parse(applyReplacements(JSON.stringify(current), replacements))
  if (JSON.stringify(next) === JSON.stringify(current)) {
    return false
  }

  await client.query('UPDATE articles SET content = $2::jsonb WHERE slug = $1', [
    slug,
    JSON.stringify(next),
  ])

  return true
}

async function main(): Promise<void> {
  loadEnvironment()

  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not set. Add it to .env.local before cleaning frontend content.')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query('BEGIN')

    for (const [sku, value] of Object.entries(shortDescriptionOverrides)) {
      const changed = await updateProductTextField(client, sku, 'short_description', () => value)
      if (changed) {
        console.log(`short_description override: ${sku}`)
      }
    }

    for (const [sku, replacements] of Object.entries(shortDescriptionReplacements)) {
      const changed = await updateProductTextField(client, sku, 'short_description', (current) =>
        applyReplacements(current, replacements),
      )
      if (changed) {
        console.log(`short_description replace: ${sku}`)
      }
    }

    for (const [sku, replacements] of Object.entries(fullDescriptionReplacements)) {
      const changed = await updateProductTextField(client, sku, 'full_description', (current) =>
        applyReplacements(current, replacements),
      )
      if (changed) {
        console.log(`full_description replace: ${sku}`)
      }
    }

    const specRows = await client.query<{ sku: string }>(
      `SELECT sku FROM products WHERE status = 'published' AND coalesce(specifications::text, '') ~ '[一-龥]'`,
    )

    for (const row of specRows.rows) {
      const changed = await updateProductTextField(client, row.sku, 'specifications', normalizeSpecifications)
      if (changed) {
        console.log(`specifications normalize: ${row.sku}`)
      }
    }

    for (const [slug, replacements] of Object.entries(articleReplacements)) {
      const changed = await updateArticleContent(client, slug, replacements)
      if (changed) {
        console.log(`article content replace: ${slug}`)
      }
    }

    await client.query('COMMIT')

    const verification = await client.query<{
      short_count: number
      full_count: number
      specs_count: number
      article_count: number
    }>(`
      SELECT
        (SELECT COUNT(*)::int FROM products WHERE status = 'published' AND coalesce(short_description, '') ~ '[一-龥]') AS short_count,
        (SELECT COUNT(*)::int FROM products WHERE status = 'published' AND coalesce(full_description::text, '') ~ '[一-龥]') AS full_count,
        (SELECT COUNT(*)::int FROM products WHERE status = 'published' AND coalesce(specifications::text, '') ~ '[一-龥]') AS specs_count,
        (SELECT COUNT(*)::int FROM articles WHERE status = 'published' AND coalesce(content::text, '') ~ '[一-龥]') AS article_count
    `)

    const counts = verification.rows[0]
    console.log('\nVerification counts:')
    console.log(`short_description: ${counts.short_count}`)
    console.log(`full_description: ${counts.full_count}`)
    console.log(`specifications: ${counts.specs_count}`)
    console.log(`articles.content: ${counts.article_count}`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
