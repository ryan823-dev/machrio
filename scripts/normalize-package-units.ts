import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { Client } from 'pg'
import { PACKAGE_UNIT_TRANSLATIONS } from '../src/lib/package-units'

function loadEnvironment(): void {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
  loadEnv()
}

async function main(): Promise<void> {
  loadEnvironment()

  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not set. Add it to .env.local before normalizing package units.')
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URI,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query('BEGIN')

    let totalUpdated = 0

    for (const [sourceUnit, targetUnit] of Object.entries(PACKAGE_UNIT_TRANSLATIONS)) {
      const result = await client.query(
        `
          UPDATE products
          SET package_unit = $2
          WHERE package_unit = $1
        `,
        [sourceUnit, targetUnit],
      )

      if (result.rowCount) {
        totalUpdated += result.rowCount
        console.log(`${sourceUnit} -> ${targetUnit}: ${result.rowCount}`)
      }
    }

    await client.query('COMMIT')

    console.log(`\nTotal products updated: ${totalUpdated}`)
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
