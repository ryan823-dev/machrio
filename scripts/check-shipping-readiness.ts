import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { Client } from 'pg'

function loadEnvironment(): void {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
  loadEnv()
}

function printSection(title: string): void {
  console.log(`\n=== ${title} ===`)
}

async function main(): Promise<void> {
  loadEnvironment()

  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not set. Add it to .env.local before checking shipping readiness.')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    const summary = await client.query<{
      total_products: number
      missing_shipping_info: number
      missing_weight_column: number
      active_methods: number
      active_rates: number
      active_free_rules: number
    }>(`
      SELECT
        (SELECT COUNT(*)::int FROM products) AS total_products,
        (
          SELECT COUNT(*)::int
          FROM products
          WHERE shipping_info IS NULL
             OR shipping_info = ''
             OR shipping_info = '{}'
             OR shipping_info = 'null'
        ) AS missing_shipping_info,
        (
          SELECT COUNT(*)::int
          FROM products
          WHERE weight IS NULL OR weight = 0
        ) AS missing_weight_column,
        (
          SELECT COUNT(*)::int
          FROM shipping_methods
          WHERE is_active = TRUE
        ) AS active_methods,
        (
          SELECT COUNT(*)::int
          FROM shipping_rates
          WHERE is_active = TRUE
        ) AS active_rates,
        (
          SELECT COUNT(*)::int
          FROM free_shipping_rules
          WHERE is_active = TRUE
        ) AS active_free_rules
    `)

    const methods = await client.query<{
      code: string
      name: string
      transit_days: number
      active_rate_count: number
      free_rule_count: number
    }>(`
      SELECT
        sm.code,
        sm.name,
        sm.transit_days,
        COUNT(DISTINCT sr.id)::int AS active_rate_count,
        COUNT(DISTINCT fsr.id)::int AS free_rule_count
      FROM shipping_methods sm
      LEFT JOIN shipping_rates sr
        ON sr.shipping_method_id = sm.id
       AND sr.is_active = TRUE
      LEFT JOIN free_shipping_rules fsr
        ON fsr.shipping_method_id = sm.id
       AND fsr.is_active = TRUE
      WHERE sm.is_active = TRUE
      GROUP BY sm.id, sm.code, sm.name, sm.transit_days, sm.sort_order
      ORDER BY sm.sort_order, sm.name
    `)

    const topCountries = await client.query<{
      shipping_method_code: string
      country_code: string
      base_weight: string
      base_rate: string
      additional_rate: string
      handling_fee: string
    }>(`
      SELECT
        sm.code AS shipping_method_code,
        sr.country_code,
        sr.base_weight::text,
        sr.base_rate::text,
        sr.additional_rate::text,
        sr.handling_fee::text
      FROM shipping_rates sr
      JOIN shipping_methods sm
        ON sm.id = sr.shipping_method_id
      WHERE sr.is_active = TRUE
        AND sm.is_active = TRUE
      ORDER BY sm.sort_order, sr.country_code
      LIMIT 30
    `)

    const totals = summary.rows[0]
    const weightCoverage = totals.total_products - totals.missing_weight_column
    const shippingInfoCoverage = totals.total_products - totals.missing_shipping_info

    printSection('Shipping Summary')
    console.log(`Active shipping methods: ${totals.active_methods}`)
    console.log(`Active shipping rates: ${totals.active_rates}`)
    console.log(`Active free-shipping rules: ${totals.active_free_rules}`)

    printSection('Product Weight Readiness')
    console.log(`Total products: ${totals.total_products}`)
    console.log(`Products with shipping_info: ${shippingInfoCoverage}`)
    console.log(`Products missing shipping_info: ${totals.missing_shipping_info}`)
    console.log(`Products with legacy weight column: ${weightCoverage}`)
    console.log(`Products missing legacy weight column: ${totals.missing_weight_column}`)
    console.log('Runtime note: shipping calculation now falls back to products.weight when shipping_info.weight is missing.')

    printSection('Methods')
    if (methods.rows.length === 0) {
      console.log('No active shipping methods found.')
    } else {
      for (const method of methods.rows) {
        console.log(
          `- ${method.code} (${method.name}) | transit_days=${method.transit_days} | rates=${method.active_rate_count} | free_rules=${method.free_rule_count}`,
        )
      }
    }

    printSection('Sample Active Rates')
    if (topCountries.rows.length === 0) {
      console.log('No active shipping rates found.')
    } else {
      for (const rate of topCountries.rows) {
        console.log(
          `- ${rate.shipping_method_code} / ${rate.country_code}: base_weight=${rate.base_weight}, base_rate=${rate.base_rate}, additional_rate=${rate.additional_rate}, handling_fee=${rate.handling_fee}`,
        )
      }
    }

    printSection('Go-Live Checklist')
    if (totals.active_rates === 0) {
      console.log('- Add shipping_rates before enabling checkout for destinations that need live quotes.')
    }
    if (totals.active_free_rules === 0) {
      console.log('- Add free_shipping_rules if you want route-specific free-shipping thresholds.')
    }
    if (totals.missing_weight_column > 0) {
      console.log(`- Fill missing product weight data for ${totals.missing_weight_column} products.`)
    }
    console.log('- Keep an OTHER rate for each method if you want a default fallback by destination.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
