import { getGlossaryTermBySlug, safeQuery } from '@/lib/db'
import { getCanonicalProductCategory, getProductExactMatchToken } from '@/lib/seo'
import { getStaticGlossaryAliasRedirects } from '@/lib/static-glossary-terms'

interface ProductLookupRow {
  id: string
  name: string
  slug: string
  sku: string | null
  source_url: string | null
  category_slug: string | null
  category_name: string | null
}

export interface PathResolution {
  exists: boolean
  redirectTo?: string
  statusCode?: 301 | 302
  matchedBy?: string
}

interface ManagedRedirectEntry {
  redirectTo: string
  statusCode: 301 | 302
}

const NO_MATCH_TOKEN = '__machrio_no_match__'
const REDIRECT_CACHE_TTL_MS = 5 * 60 * 1000

let redirectCache:
  | {
      expiresAt: number
      entries: Map<string, ManagedRedirectEntry>
    }
  | null = null

// Seed a few of the highest-impression dead URLs so recovery starts immediately
// while the automatic matcher covers the long tail.
const MANUAL_PRODUCT_REDIRECTS: Record<string, string> = {
  '/product/oil-seals/nbr-tc-skeleton-oil-seal-nitrile-rubber-dual-lip-design-for-shaft-sealing-oil-an-555015':
    '/product/plain-bearings/nbr-tc-skeleton-oil-seal-nitrile-rubber-dual-lip-design-for-shaft-sealing-oil-and-dust-resistant-ideal-for-motors-gearboxes-pumps-10087712555015',
  '/product/hand-and-arm-protection/ptfe-composite-high-temp-safety-gloves-212-f-11-inch-length-pkg-qty-8-3551':
    '/product/safety-gloves/ptfe-composite-high-temp-safety-gloves-212-f-11-inch-length-pkg-qty-8-aj3551',
  '/product/floor-mats/insulation-rubber-mat-rubber-construction-electrical-insulation-rating-39-in-by--h-8178':
    '/product/floor-protection-mats/insulation-rubber-mat-rubber-construction-electrical-insulation-rating-39-in-by-197-in-8178',
  '/product/seals-gaskets/pu-hydraulic-seal-polyurethane-oil-seal-for-industrial-applications-0-04in-edge--636903':
    '/product/plain-bearings/pu-hydraulic-seal-polyurethane-oil-seal-for-industrial-applications-0-04in-edge-thickness-10129847636903',
  '/product/surface-protection-tape/high-voltage-rubber-insulation-tape-0-91-in-x-15-ft-10kv-pkg-qty-2-2620':
    '/product/surface-protection-tape/high-voltage-rubber-insulation-tape-0-91-in-x-15-ft-10kv-pkg-qty-2-ae2592620',
}

const MANUAL_GLOSSARY_REDIRECTS: Record<string, string> = {
  ...getStaticGlossaryAliasRedirects(),
}

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

function normalizeToken(value: string | null | undefined): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getMeaningfulSlugWords(slug: string): string[] {
  return Array.from(
    new Set(
      slug
        .toLowerCase()
        .split('-')
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !/^\d+$/.test(token)),
    ),
  )
}

function countWordOverlap(a: string[], b: string[]): number {
  const left = new Set(a)
  return b.filter((token) => left.has(token)).length
}

function buildCanonicalProductPath(candidate: ProductLookupRow): string {
  const canonicalCategory = getCanonicalProductCategory({
    name: candidate.name,
    slug: candidate.slug,
    categorySlug: candidate.category_slug,
    categoryName: candidate.category_name,
  })

  return `/product/${canonicalCategory.slug}/${candidate.slug}`
}

async function getManagedRedirectEntries(): Promise<Map<string, ManagedRedirectEntry>> {
  if (redirectCache && redirectCache.expiresAt > Date.now()) {
    return redirectCache.entries
  }

  if (!process.env.DATABASE_URI) {
    const entries = redirectCache?.entries || new Map<string, ManagedRedirectEntry>()
    redirectCache = {
      expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS,
      entries,
    }
    return entries
  }

  try {
    const [{ getPayload }, configModule] = await Promise.all([
      import('payload'),
      import('@payload-config'),
    ])
    const payload = await getPayload({ config: configModule.default })
    const entries = new Map<string, ManagedRedirectEntry>()
    let page = 1

    while (true) {
      const response = await payload.find({
        collection: 'redirects',
        depth: 0,
        limit: 1000,
        page,
        where: {
          isActive: {
            equals: true,
          },
        },
      })

      for (const doc of response.docs as unknown as Array<Record<string, unknown>>) {
        const fromPath = normalizeComparablePath(typeof doc.from === 'string' ? doc.from : null)
        const toPath = normalizeComparablePath(typeof doc.to === 'string' ? doc.to : null)

        if (!fromPath || !toPath || fromPath === toPath) continue

        entries.set(fromPath, {
          redirectTo: toPath,
          statusCode: doc.type === '302' ? 302 : 301,
        })
      }

      if (!response.hasNextPage) break
      page = response.nextPage || page + 1
    }

    redirectCache = {
      expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS,
      entries,
    }

    return entries
  } catch (error) {
    console.error('[getManagedRedirectEntries] failed to load redirects:', error)
    return redirectCache?.entries || new Map()
  }
}

async function getManagedRedirect(pathname: string): Promise<PathResolution | null> {
  const normalizedPath = normalizeComparablePath(pathname)
  if (!normalizedPath) return null

  const entries = await getManagedRedirectEntries()
  const match = entries.get(normalizedPath)

  if (!match) return null

  return {
    exists: false,
    redirectTo: match.redirectTo,
    statusCode: match.statusCode,
    matchedBy: 'payload-redirect',
  }
}

async function getPublishedProductBySlug(slug: string): Promise<ProductLookupRow | null> {
  const result = await safeQuery<ProductLookupRow>(
    `SELECT
       p.id,
       p.name,
       p.slug,
       p.sku,
       p.source_url,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.primary_category_id = c.id
     WHERE p.slug = $1 AND p.status = 'published'
     LIMIT 1`,
    [slug],
  )

  return result.rows[0] || null
}

async function findProductsBySourcePath(pathname: string): Promise<ProductLookupRow[]> {
  const normalizedPath = normalizeComparablePath(pathname)

  if (!normalizedPath) return []

  const likePatterns = Array.from(
    new Set([
      `%${normalizedPath}`,
      `%${normalizedPath}/`,
      `%${normalizedPath}?%`,
      `%${normalizedPath}/?%`,
      `%${normalizedPath}#%`,
      `%${normalizedPath}/#%`,
    ]),
  )

  const result = await safeQuery<ProductLookupRow>(
    `SELECT
       p.id,
       p.name,
       p.slug,
       p.sku,
       p.source_url,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.primary_category_id = c.id
     WHERE p.status = 'published'
       AND lower(COALESCE(p.source_url, '')) LIKE ANY($1::text[])
     ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
     LIMIT 20`,
    [likePatterns],
  )

  return result.rows.filter((candidate) => normalizeComparablePath(candidate.source_url) === normalizedPath)
}

function buildLegacySignals(pathname: string, category: string, slug: string) {
  const lastSlugToken = slug.split('-').filter(Boolean).at(-1) || ''
  const exactMatchToken = getProductExactMatchToken(slug)

  const exactTerms = Array.from(
    new Set([slug.toLowerCase(), lastSlugToken.toLowerCase(), exactMatchToken?.toLowerCase()].filter(Boolean)),
  )

  const normalizedTerms = Array.from(
    new Set(
      [
        normalizeToken(slug),
        normalizeToken(lastSlugToken),
        normalizeToken(exactMatchToken),
      ].filter((token) => token.length >= 4),
    ),
  )

  const likePatterns = Array.from(
    new Set(
      [
        normalizeToken(lastSlugToken),
        normalizeToken(exactMatchToken),
      ]
        .filter((token) => token.length >= 4)
        .map((token) => `%${token}`),
    ),
  )

  const sourcePatterns = Array.from(
    new Set(
      [pathname.toLowerCase(), slug.toLowerCase()]
        .filter(Boolean)
        .map((token) => `%${token}%`),
    ),
  )

  return {
    pathname,
    category,
    slug,
    exactTerms,
    normalizedTerms,
    likePatterns: likePatterns.length > 0 ? likePatterns : [`%${NO_MATCH_TOKEN}`],
    sourcePatterns: sourcePatterns.length > 0 ? sourcePatterns : [`%${NO_MATCH_TOKEN}%`],
    lastSlugToken: normalizeToken(lastSlugToken),
    exactMatchToken: normalizeToken(exactMatchToken),
    slugWords: getMeaningfulSlugWords(slug),
    normalizedSlug: normalizeToken(slug),
  }
}

async function findLegacyProductCandidates(
  pathname: string,
  category: string,
  slug: string,
): Promise<ProductLookupRow[]> {
  const signals = buildLegacySignals(pathname, category, slug)

  const result = await safeQuery<ProductLookupRow>(
    `SELECT
       p.id,
       p.name,
       p.slug,
       p.sku,
       p.source_url,
       c.slug AS category_slug,
       c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON p.primary_category_id = c.id
     WHERE p.status = 'published'
       AND (
         lower(p.slug) = ANY($1::text[])
         OR lower(COALESCE(p.sku, '')) = ANY($1::text[])
         OR regexp_replace(lower(COALESCE(p.sku, '')), '[^a-z0-9]', '', 'g') = ANY($2::text[])
         OR regexp_replace(lower(p.slug), '[^a-z0-9]', '', 'g') = ANY($2::text[])
         OR regexp_replace(lower(p.slug), '[^a-z0-9]', '', 'g') LIKE ANY($3::text[])
         OR lower(COALESCE(p.source_url, '')) LIKE ANY($4::text[])
       )
     ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
     LIMIT 20`,
    [
      signals.exactTerms.length > 0 ? signals.exactTerms : [NO_MATCH_TOKEN],
      signals.normalizedTerms.length > 0 ? signals.normalizedTerms : [NO_MATCH_TOKEN],
      signals.likePatterns,
      signals.sourcePatterns,
    ],
  )

  return result.rows
}

function scoreLegacyProductCandidate(
  candidate: ProductLookupRow,
  pathname: string,
  category: string,
  slug: string,
) {
  const signals = buildLegacySignals(pathname, category, slug)
  const candidateSlug = normalizeToken(candidate.slug)
  const candidateSku = normalizeToken(candidate.sku)
  const candidateLastToken = normalizeToken(candidate.slug.split('-').filter(Boolean).at(-1) || '')
  const candidateWords = getMeaningfulSlugWords(candidate.slug)

  let score = 0
  let strongSignal = false

  if (candidateSlug === signals.normalizedSlug) {
    score += 200
    strongSignal = true
  }

  if (signals.lastSlugToken.length >= 4) {
    if (candidateLastToken === signals.lastSlugToken) {
      score += 180
      strongSignal = true
    } else if (candidateLastToken.endsWith(signals.lastSlugToken)) {
      score += 160
      strongSignal = true
    }

    if (candidateSku === signals.lastSlugToken) {
      score += 160
      strongSignal = true
    } else if (candidateSku.endsWith(signals.lastSlugToken)) {
      score += 145
      strongSignal = true
    }
  }

  if (signals.exactMatchToken.length >= 4) {
    if (candidateSku === signals.exactMatchToken) {
      score += 90
      strongSignal = true
    } else if (candidateSlug.includes(signals.exactMatchToken)) {
      score += 45
    }
  }

  const sourceUrl = candidate.source_url?.toLowerCase() || ''
  if (sourceUrl.includes(pathname.toLowerCase())) {
    score += 110
    strongSignal = true
  } else if (sourceUrl.includes(slug.toLowerCase())) {
    score += 80
    strongSignal = true
  }

  const overlap = countWordOverlap(signals.slugWords, candidateWords)
  score += overlap * 10

  if (normalizeToken(candidate.category_slug) === normalizeToken(category)) {
    score += 5
  }

  return {
    candidate,
    score,
    overlap,
    strongSignal,
  }
}

export async function resolveProductPath(
  pathname: string,
  category: string,
  slug: string,
): Promise<PathResolution> {
  const normalizedPath = normalizeComparablePath(pathname) || trimTrailingSlash(pathname)
  const manualRedirect = MANUAL_PRODUCT_REDIRECTS[normalizedPath]

  if (manualRedirect) {
    return {
      exists: false,
      redirectTo: manualRedirect,
      statusCode: 301,
      matchedBy: 'manual-product-map',
    }
  }

  try {
    const managedRedirect = await getManagedRedirect(normalizedPath)
    if (managedRedirect) {
      return managedRedirect
    }

    if (!process.env.DATABASE_URI) {
      return { exists: false, matchedBy: 'no-product-database' }
    }

    const exactProduct = await getPublishedProductBySlug(slug)

    if (exactProduct) {
      const canonicalPath = buildCanonicalProductPath(exactProduct)
      if (canonicalPath !== normalizedPath) {
        return {
          exists: true,
          redirectTo: canonicalPath,
          statusCode: 301,
          matchedBy: 'canonical-product-path',
        }
      }

      return { exists: true, matchedBy: 'exact-product-slug' }
    }

    const exactSourceMatches = await findProductsBySourcePath(normalizedPath)

    if (exactSourceMatches.length > 0) {
      const [bestSourceMatch] = exactSourceMatches
        .map((candidate) => scoreLegacyProductCandidate(candidate, normalizedPath, category, slug))
        .sort((a, b) => b.score - a.score)

      if (bestSourceMatch) {
        const canonicalPath = buildCanonicalProductPath(bestSourceMatch.candidate)
        if (canonicalPath !== normalizedPath) {
          return {
            exists: false,
            redirectTo: canonicalPath,
            statusCode: 301,
            matchedBy: 'source-url-match',
          }
        }
      }
    }

    const rankedCandidates = (await findLegacyProductCandidates(normalizedPath, category, slug))
      .map((candidate) => scoreLegacyProductCandidate(candidate, normalizedPath, category, slug))
      .filter((candidate) => candidate.strongSignal)
      .sort((a, b) => b.score - a.score)

    const [best, second] = rankedCandidates
    const isConfidentMatch =
      best &&
      best.score >= 150 &&
      (best.overlap >= 2 || best.score >= 190) &&
      (!second || best.score - second.score >= 20)

    if (isConfidentMatch) {
      const canonicalPath = buildCanonicalProductPath(best.candidate)
      if (canonicalPath !== normalizedPath) {
        return {
          exists: false,
          redirectTo: canonicalPath,
          statusCode: 301,
          matchedBy: 'legacy-product-match',
        }
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('[resolveProductPath] failed to resolve product path:', error)
    return { exists: true, matchedBy: 'product-resolution-error-fallback' }
  }
}

export async function resolveGlossaryPath(pathname: string, slug: string): Promise<PathResolution> {
  const normalizedPath = normalizeComparablePath(pathname) || trimTrailingSlash(pathname)
  const manualRedirect = MANUAL_GLOSSARY_REDIRECTS[normalizedPath]

  if (manualRedirect) {
    return {
      exists: false,
      redirectTo: manualRedirect,
      statusCode: 301,
      matchedBy: 'manual-glossary-map',
    }
  }

  try {
    const managedRedirect = await getManagedRedirect(normalizedPath)
    if (managedRedirect) {
      return managedRedirect
    }

    const term = await getGlossaryTermBySlug(slug)
    return term ? { exists: true, matchedBy: 'glossary-term-found' } : { exists: false }
  } catch (error) {
    console.error('[resolveGlossaryPath] failed to resolve glossary path:', error)
    return { exists: true, matchedBy: 'glossary-resolution-error-fallback' }
  }
}
