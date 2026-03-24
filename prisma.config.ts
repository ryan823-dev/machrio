import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    migrationsDirectory: './prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URI,
  },
})
