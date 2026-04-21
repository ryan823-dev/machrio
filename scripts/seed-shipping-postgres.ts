import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { Client } from 'pg'

interface ShippingMethodConfig {
  code: string
  name: string
  description?: string
  transitDays: number
  sortOrder?: number
  isActive?: boolean
}

interface ShippingRateConfig {
  shippingMethodCode: string
  countryCode: string
  baseWeight: number
  baseRate: number
  additionalRate: number
  handlingFee?: number
  isActive?: boolean
}

interface FreeShippingRuleConfig {
  shippingMethodCode: string
  countryCode?: string | null
  minimumAmount: number
  isActive?: boolean
}

interface ShippingSeedConfig {
  methods: ShippingMethodConfig[]
  rates: ShippingRateConfig[]
  freeShippingRules: FreeShippingRuleConfig[]
}

function loadEnvironment(): void {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
  loadEnv()
}

function resolveConfigPath(): string {
  const flagIndex = process.argv.indexOf('--config')
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) {
    return path.resolve(process.cwd(), process.argv[flagIndex + 1])
  }

  return path.resolve(process.cwd(), 'scripts/shipping-config.json')
}

function readConfig(filePath: string): ShippingSeedConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Shipping config not found at ${filePath}. Copy scripts/shipping-config.template.json to scripts/shipping-config.json and fill in your live rates first.`,
    )
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<ShippingSeedConfig>
  return {
    methods: Array.isArray(parsed.methods) ? parsed.methods : [],
    rates: Array.isArray(parsed.rates) ? parsed.rates : [],
    freeShippingRules: Array.isArray(parsed.freeShippingRules) ? parsed.freeShippingRules : [],
  }
}

function normalizeCountryCode(countryCode?: string | null): string | null {
  const normalized = countryCode?.trim().toUpperCase() || ''
  return normalized ? normalized : null
}

async function ensureShippingTables(client: Client): Promise<void> {
  await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')

  await client.query(`
    CREATE TABLE IF NOT EXISTS shipping_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      code VARCHAR NOT NULL UNIQUE,
      description TEXT,
      name VARCHAR NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      transit_days INTEGER NOT NULL DEFAULT 0
    )
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS shipping_rates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      shipping_method_id UUID NOT NULL REFERENCES shipping_methods(id) ON DELETE CASCADE,
      country_code VARCHAR NOT NULL,
      base_weight NUMERIC NOT NULL DEFAULT 0,
      base_rate NUMERIC NOT NULL DEFAULT 0,
      additional_rate NUMERIC NOT NULL DEFAULT 0,
      handling_fee NUMERIC NOT NULL DEFAULT 0
    )
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS free_shipping_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      shipping_method_id UUID NOT NULL REFERENCES shipping_methods(id) ON DELETE CASCADE,
      country_code VARCHAR,
      minimum_amount NUMERIC NOT NULL DEFAULT 0
    )
  `)
}

async function upsertShippingMethods(
  client: Client,
  methods: ShippingMethodConfig[],
): Promise<Map<string, string>> {
  const methodIds = new Map<string, string>()
  const methodCodes = methods.map((method) => method.code)

  for (const method of methods) {
    if (!method.code || !method.name) {
      throw new Error(`Each shipping method requires both "code" and "name". Invalid method: ${JSON.stringify(method)}`)
    }

    const transitDays = Number(method.transitDays)
    if (!Number.isFinite(transitDays) || transitDays < 0) {
      throw new Error(`Shipping method "${method.code}" has an invalid transitDays value.`)
    }

    const existing = await client.query<{ id: string }>(
      'SELECT id FROM shipping_methods WHERE code = $1 LIMIT 1',
      [method.code],
    )

    const params = [
      method.name,
      method.description || '',
      transitDays,
      method.sortOrder ?? 0,
      method.isActive ?? true,
      method.code,
    ]

    if (existing.rows[0]?.id) {
      await client.query(
        `UPDATE shipping_methods
         SET name = $1,
             description = $2,
             transit_days = $3,
             sort_order = $4,
             is_active = $5,
             updated_at = NOW()
         WHERE code = $6`,
        params,
      )
      methodIds.set(method.code, existing.rows[0].id)
      continue
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO shipping_methods (name, description, transit_days, sort_order, is_active, code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      params,
    )

    methodIds.set(method.code, inserted.rows[0].id)
  }

  if (methodCodes.length > 0) {
    await client.query(
      `UPDATE shipping_methods
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE NOT (code = ANY($1::text[]))`,
      [methodCodes],
    )
  }

  return methodIds
}

async function upsertShippingRates(
  client: Client,
  rates: ShippingRateConfig[],
  methodIds: Map<string, string>,
): Promise<void> {
  for (const rate of rates) {
    const methodId = methodIds.get(rate.shippingMethodCode)
    if (!methodId) {
      throw new Error(`Shipping rate references unknown method "${rate.shippingMethodCode}".`)
    }

    const countryCode = normalizeCountryCode(rate.countryCode)
    if (!countryCode) {
      throw new Error(`Shipping rate for method "${rate.shippingMethodCode}" is missing a countryCode.`)
    }

    const existing = await client.query<{ id: string }>(
      `SELECT id
       FROM shipping_rates
       WHERE shipping_method_id = $1 AND country_code = $2
       LIMIT 1`,
      [methodId, countryCode],
    )

    const params = [
      methodId,
      countryCode,
      rate.baseWeight,
      rate.baseRate,
      rate.additionalRate,
      rate.handlingFee ?? 0,
      rate.isActive ?? true,
    ]

    if (existing.rows[0]?.id) {
      await client.query(
        `UPDATE shipping_rates
         SET base_weight = $3,
             base_rate = $4,
             additional_rate = $5,
             handling_fee = $6,
             is_active = $7,
             updated_at = NOW()
         WHERE shipping_method_id = $1 AND country_code = $2`,
        params,
      )
      continue
    }

    await client.query(
      `INSERT INTO shipping_rates (
         shipping_method_id,
         country_code,
         base_weight,
         base_rate,
         additional_rate,
         handling_fee,
         is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      params,
    )
  }
}

async function upsertFreeShippingRules(
  client: Client,
  rules: FreeShippingRuleConfig[],
  methodIds: Map<string, string>,
): Promise<void> {
  for (const rule of rules) {
    const methodId = methodIds.get(rule.shippingMethodCode)
    if (!methodId) {
      throw new Error(`Free-shipping rule references unknown method "${rule.shippingMethodCode}".`)
    }

    const countryCode = normalizeCountryCode(rule.countryCode)
    const lookupCountryCode = countryCode || ''
    const existing = await client.query<{ id: string }>(
      `SELECT id
       FROM free_shipping_rules
       WHERE shipping_method_id = $1 AND COALESCE(country_code, '') = $2
       LIMIT 1`,
      [methodId, lookupCountryCode],
    )

    if (existing.rows[0]?.id) {
      await client.query(
        `UPDATE free_shipping_rules
         SET country_code = $2,
             minimum_amount = $3,
             is_active = $4,
             updated_at = NOW()
         WHERE shipping_method_id = $1 AND COALESCE(country_code, '') = $5`,
        [methodId, countryCode, rule.minimumAmount, rule.isActive ?? true, lookupCountryCode],
      )
      continue
    }

    await client.query(
      `INSERT INTO free_shipping_rules (
         shipping_method_id,
         country_code,
         minimum_amount,
         is_active
       ) VALUES ($1, $2, $3, $4)`,
      [methodId, countryCode, rule.minimumAmount, rule.isActive ?? true],
    )
  }
}

async function main(): Promise<void> {
  loadEnvironment()

  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not set. Add it to .env.local before seeding shipping data.')
  }

  const configPath = resolveConfigPath()
  const config = readConfig(configPath)

  const client = new Client({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query('BEGIN')
    await ensureShippingTables(client)

    const methodIds = await upsertShippingMethods(client, config.methods)
    await upsertShippingRates(client, config.rates, methodIds)
    await upsertFreeShippingRules(client, config.freeShippingRules, methodIds)

    await client.query('COMMIT')

    console.log(`Shipping methods upserted: ${config.methods.length}`)
    console.log(`Shipping rates upserted: ${config.rates.length}`)
    console.log(`Free-shipping rules upserted: ${config.freeShippingRules.length}`)

    if (config.rates.length === 0) {
      console.warn('No shipping rates were provided. Checkout will continue to show "quote required" until live rates are added.')
    }
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
