import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload/payload.config'
import { getCanonicalProductCategory } from '../src/lib/seo'

type GenericDoc = Record<string, unknown>

function trimTrailingSlash(pathname: string): string {
  return pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function normalizeComparablePath(input: string | null | undefined): string | null {
  const raw = (input || '').trim()
  if (!raw) return null

  let path = raw

  try {
    if (/^https?:\/\//i.test(raw)) {
      path = new URL(raw).pathname
    }
  } catch {
    path = raw
  }

  const withoutHash = path.split('#')[0] || path
  const withoutQuery = withoutHash.split('?')[0] || withoutHash
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
  const normalizedSlashes = withLeadingSlash.replace(/\/{2,}/g, '/').toLowerCase()

  return trimTrailingSlash(normalizedSlashes)
}

function getCategoryContext(product: GenericDoc): { slug: string | null; name: string | null } {
  const primaryCategory = product.primaryCategory

  if (!primaryCategory || typeof primaryCategory !== 'object') {
    return { slug: null, name: null }
  }

  const category = primaryCategory as Record<string, unknown>
  return {
    slug: typeof category.slug === 'string' ? category.slug : null,
    name: typeof category.name === 'string' ? category.name : null,
  }
}

async function collectAllDocs(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'products' | 'redirects',
  // Payload's generated Where type is collection-specific; keep this helper permissive.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where?: any,
): Promise<GenericDoc[]> {
  const docs: GenericDoc[] = []
  let page = 1

  while (true) {
    const response = await payload.find({
      collection,
      where,
      depth: collection === 'products' ? 1 : 0,
      limit: 1000,
      page,
    })

    docs.push(...(response.docs as GenericDoc[]))

    if (!response.hasNextPage) break
    page = response.nextPage || page + 1
  }

  return docs
}

async function main() {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not configured. Run this on a machine with database access.')
  }

  const shouldWrite = process.argv.includes('--write')
  const payload = await getPayload({ config })

  const [products, redirects] = await Promise.all([
    collectAllDocs(payload, 'products', {
      status: {
        equals: 'published',
      },
    }),
    collectAllDocs(payload, 'redirects'),
  ])

  const existingRedirects = new Map<
    string,
    {
      id: string
      to: string | null
      type: string | null
      isActive: boolean
    }
  >()

  for (const redirect of redirects) {
    const fromPath = normalizeComparablePath(typeof redirect.from === 'string' ? redirect.from : null)
    const id = typeof redirect.id === 'string' ? redirect.id : null

    if (!fromPath || !id) continue

    existingRedirects.set(fromPath, {
      id,
      to: normalizeComparablePath(typeof redirect.to === 'string' ? redirect.to : null),
      type: typeof redirect.type === 'string' ? redirect.type : null,
      isActive: Boolean(redirect.isActive),
    })
  }

  let candidates = 0
  let created = 0
  let updated = 0
  let skipped = 0

  for (const product of products) {
    const sourcePath = normalizeComparablePath(typeof product.sourceUrl === 'string' ? product.sourceUrl : null)
    const productSlug = typeof product.slug === 'string' ? product.slug : null
    const productName = typeof product.name === 'string' ? product.name : null

    if (!sourcePath || !productSlug || !productName) {
      skipped++
      continue
    }

    const category = getCategoryContext(product)
    const canonicalCategory = getCanonicalProductCategory({
      name: productName,
      slug: productSlug,
      categorySlug: category.slug,
      categoryName: category.name,
    })
    const destinationPath = `/product/${canonicalCategory.slug}/${productSlug}`

    if (sourcePath === destinationPath) {
      skipped++
      continue
    }

    candidates++

    const existing = existingRedirects.get(sourcePath)
    const needsUpdate =
      existing &&
      (existing.to !== destinationPath || existing.type !== '301' || existing.isActive !== true)

    if (!existing) {
      if (shouldWrite) {
        await payload.create({
          collection: 'redirects',
          data: {
            from: sourcePath,
            to: destinationPath,
            type: '301',
            isActive: true,
            notes: 'Auto-synced from product sourceUrl',
          },
        })
      }

      existingRedirects.set(sourcePath, {
        id: `created:${sourcePath}`,
        to: destinationPath,
        type: '301',
        isActive: true,
      })
      created++
      continue
    }

    if (needsUpdate) {
      if (shouldWrite) {
        await payload.update({
          collection: 'redirects',
          id: existing.id,
          data: {
            to: destinationPath,
            type: '301',
            isActive: true,
            notes: 'Auto-synced from product sourceUrl',
          },
        })
      }

      existingRedirects.set(sourcePath, {
        ...existing,
        to: destinationPath,
        type: '301',
        isActive: true,
      })
      updated++
      continue
    }

    skipped++
  }

  console.log(
    JSON.stringify(
      {
        mode: shouldWrite ? 'write' : 'dry-run',
        productsScanned: products.length,
        redirectRulesScanned: redirects.length,
        candidates,
        created,
        updated,
        skipped,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('[sync-product-source-redirects] failed:', error)
  process.exit(1)
})
