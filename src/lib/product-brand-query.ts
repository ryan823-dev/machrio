import type { Pool } from 'pg'

type ProductBrandQueryParts = {
  brandSelectSql: string
  brandJoinSql: string
}

let cachedQueryParts: ProductBrandQueryParts | null = null
let queryPartsPromise: Promise<ProductBrandQueryParts> | null = null

async function detectProductBrandQueryParts(pool: Pool): Promise<ProductBrandQueryParts> {
  const result = await pool.query<{
    has_brand: boolean
    has_brand_id: boolean
    has_brands_table: boolean
  }>(`
    SELECT
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'brand'
      ) AS has_brand,
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'brand_id'
      ) AS has_brand_id,
      EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'brands'
      ) AS has_brands_table
  `)

  const schema = result.rows[0]

  if (schema?.has_brand && schema.has_brand_id && schema.has_brands_table) {
    return {
      brandSelectSql: `COALESCE(NULLIF(TRIM(p.brand), ''), b.name) AS brand_name`,
      brandJoinSql: `LEFT JOIN brands b ON p.brand_id = b.id`,
    }
  }

  if (schema?.has_brand) {
    return {
      brandSelectSql: `NULLIF(TRIM(p.brand), '') AS brand_name`,
      brandJoinSql: '',
    }
  }

  if (schema?.has_brand_id && schema.has_brands_table) {
    return {
      brandSelectSql: `b.name AS brand_name`,
      brandJoinSql: `LEFT JOIN brands b ON p.brand_id = b.id`,
    }
  }

  return {
    brandSelectSql: `NULL::text AS brand_name`,
    brandJoinSql: '',
  }
}

export async function getProductBrandQueryParts(pool: Pool): Promise<ProductBrandQueryParts> {
  if (cachedQueryParts) {
    return cachedQueryParts
  }

  if (!queryPartsPromise) {
    queryPartsPromise = detectProductBrandQueryParts(pool)
      .then((parts) => {
        cachedQueryParts = parts
        return parts
      })
      .finally(() => {
        queryPartsPromise = null
      })
  }

  return queryPartsPromise
}
