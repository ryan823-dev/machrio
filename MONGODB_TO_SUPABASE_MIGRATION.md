# MongoDB to Supabase PostgreSQL Migration Guide

## Overview

This document outlines the steps to migrate Machrio from MongoDB to Supabase PostgreSQL.

## Current Status

| Task | Status |
|------|--------|
| MongoDB Backup | ✅ Completed |
| Supabase Project | ✅ Created |
| PostgreSQL Adapter | ✅ Installed |
| Build Verification | ✅ Passed |
| Database Connection | ⏳ Waiting for setup |

## Quick Start (When Supabase is Ready)

```bash
cd machrio

# 1. Enable PostgreSQL
# Edit .env.local and set: USE_POSTGRES=1

# 2. Run Payload CMS migrations to create tables
npm run payload migrate

# 3. Migrate data from MongoDB
node scripts/migrate-to-supabase.js

# 4. Deploy to Vercel
# Add to Vercel environment variables:
# - USE_POSTGRES=1
# - DATABASE_URI=<your-connection-string>
```

---

## Detailed Migration Steps

### Step 1: Verify Supabase Database is Ready

1. Go to: https://supabase.com/dashboard/project/uvbzobhfpjbcggspassa/settings/database
2. Confirm "Database" section shows "Available" status
3. Copy the **Connection String** (URI format)

### Step 2: Configure Environment Variables

Update `.env.local`:

```bash
# Enable PostgreSQL
USE_POSTGRES=1

# Supabase connection string
DATABASE_URI=postgresql://postgres:[YOUR-PASSWORD]@db.uvbzobhfpjbcggspassa.supabase.co:5432/postgres
```

### Step 3: Run Database Migrations

```bash
# Create all required tables in PostgreSQL
npm run payload migrate
```

### Step 4: Migrate Data

```bash
# Migrate data from MongoDB JSON backups
node scripts/migrate-to-supabase.js
```

### Step 5: Test Locally

```bash
# Start development server
npm run dev

# Visit http://localhost:3000
# Test admin panel: http://localhost:3000/admin
```

### Step 6: Deploy to Vercel

1. Go to Vercel Dashboard > Machrio > Settings > Environment Variables
2. Add:
   - `USE_POSTGRES` = `1`
   - `DATABASE_URI` = your Supabase connection string
3. Redeploy

---

## Rollback Plan

If migration fails:

1. Set `USE_POSTGRES=0` in `.env.local`
2. MongoDB connection will be restored automatically
3. Data is backed up in `/backup/mongodb-export/`

---

## Troubleshooting

### "Database is starting up"
- Wait 5-10 minutes for Supabase to fully initialize
- Check Dashboard for "Project healthy" status

### Connection Refused
- Verify IP whitelist includes `0.0.0.0/0` (all IPs)
- Check connection string format is correct

### Build Fails
- Ensure `USE_POSTGRES=0` for local development
- Only set `USE_POSTGRES=1` after database is ready

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Payload CMS PostgreSQL Adapter](https://payloadcms.com/docs/database/postgres)
- [Migration Script Location](./scripts/migrate-to-supabase.js)
