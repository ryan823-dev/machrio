import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload/payload.config'
import { builtinKnowledgeArticles } from '../src/content/knowledge-articles'
import { STATIC_GLOSSARY_TERMS, getStaticGlossaryAliasRedirects } from '../src/lib/static-glossary-terms'

type GenericDoc = Record<string, unknown>

const PRIORITY_ARTICLE_SLUGS = new Set([
  'how-to-choose-lockout-tagout-kits-buying-guide',
  'how-to-choose-respiratory-protection-buying-guide',
  'how-to-choose-respirator-for-your-job',
  'how-to-choose-hot-melt-adhesives-for-packaging-assembly-and-rework',
  'how-to-buy-plastic-perforated-sheets-for-guards-panels-and-fabrication',
  'how-to-specify-shaft-grounding-rings-for-vfd-motors',
  'how-to-choose-oil-seals-for-rotating-equipment',
])

function trimTrailingSlash(pathname: string): string {
  return pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function normalizePath(input: string): string {
  const withoutHash = input.split('#')[0] || input
  const withoutQuery = withoutHash.split('?')[0] || withoutHash
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
  return trimTrailingSlash(withLeadingSlash.replace(/\/{2,}/g, '/').toLowerCase())
}

async function collectCategoryIdsBySlug(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slugs: string[],
): Promise<Map<string, string>> {
  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)))
  const categoryIds = new Map<string, string>()

  if (uniqueSlugs.length === 0) return categoryIds

  const categories = await payload.find({
    collection: 'categories',
    limit: 1000,
    depth: 0,
    where: {
      slug: {
        in: uniqueSlugs,
      },
    },
  })

  for (const category of categories.docs as GenericDoc[]) {
    const slug = typeof category.slug === 'string' ? category.slug : null
    const id = typeof category.id === 'string' ? category.id : null
    if (slug && id) {
      categoryIds.set(slug, id)
    }
  }

  return categoryIds
}

async function upsertArticle(
  payload: Awaited<ReturnType<typeof getPayload>>,
  article: (typeof builtinKnowledgeArticles)[number],
  categoryIdsBySlug: Map<string, string>,
  shouldWrite: boolean,
) {
  const existing = await payload.find({
    collection: 'articles',
    limit: 1,
    depth: 0,
    where: {
      slug: {
        equals: article.slug,
      },
    },
  })

  const relatedCategories = (article.relatedCategorySlugs || [])
    .map((slug) => categoryIdsBySlug.get(slug))
    .filter((id): id is string => Boolean(id))

  const data = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    quickAnswer: article.quickAnswer || undefined,
    faq: article.faq || [],
    category: article.category,
    tags: article.tags,
    author: article.author,
    status: 'published' as const,
    publishedAt: article.publishedAt,
    relatedCategories: relatedCategories.length > 0 ? relatedCategories : undefined,
    seo: {
      metaTitle: article.metaTitle || undefined,
      metaDescription: article.metaDescription || undefined,
    },
  }

  if (!shouldWrite) {
    return existing.docs.length > 0 ? 'would-update' : 'would-create'
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'articles',
      id: existing.docs[0].id,
      data,
    })
    return 'updated'
  }

  await payload.create({
    collection: 'articles',
    data,
  })
  return 'created'
}

async function upsertGlossaryTerm(
  payload: Awaited<ReturnType<typeof getPayload>>,
  term: (typeof STATIC_GLOSSARY_TERMS)[number],
  shouldWrite: boolean,
) {
  const existing = await payload.find({
    collection: 'glossary-terms',
    limit: 1,
    depth: 0,
    where: {
      slug: {
        equals: term.slug,
      },
    },
  })

  const data = {
    term: term.term,
    slug: term.slug,
    fullName: term.fullName || undefined,
    definition: term.definition,
    category: term.category,
    status: 'published' as const,
    seo: {
      metaTitle: `What is ${term.term}? | Machrio`,
      metaDescription: term.definition.slice(0, 155),
    },
  }

  if (!shouldWrite) {
    return existing.docs.length > 0 ? 'would-update' : 'would-create'
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'glossary-terms',
      id: existing.docs[0].id,
      data,
    })
    return 'updated'
  }

  await payload.create({
    collection: 'glossary-terms',
    data,
  })
  return 'created'
}

async function upsertRedirect(
  payload: Awaited<ReturnType<typeof getPayload>>,
  from: string,
  to: string,
  shouldWrite: boolean,
) {
  const existing = await payload.find({
    collection: 'redirects',
    limit: 1,
    depth: 0,
    where: {
      from: {
        equals: from,
      },
    },
  })

  const data = {
    from,
    to,
    type: '301' as const,
    isActive: true,
    notes: 'Static glossary alias recovery',
  }

  if (!shouldWrite) {
    return existing.docs.length > 0 ? 'would-update' : 'would-create'
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'redirects',
      id: existing.docs[0].id,
      data,
    })
    return 'updated'
  }

  await payload.create({
    collection: 'redirects',
    data,
  })
  return 'created'
}

async function main() {
  if (!process.env.DATABASE_URI) {
    throw new Error('DATABASE_URI is not configured. Run this on a machine with database access.')
  }

  const shouldWrite = process.argv.includes('--write')
  const payload = await getPayload({ config })
  const priorityArticles = builtinKnowledgeArticles.filter((article) =>
    PRIORITY_ARTICLE_SLUGS.has(article.slug),
  )
  const categoryIdsBySlug = await collectCategoryIdsBySlug(
    payload,
    priorityArticles.flatMap((article) => article.relatedCategorySlugs || []),
  )
  const glossaryRedirects = Object.entries(getStaticGlossaryAliasRedirects()).map(([from, to]) => ({
    from: normalizePath(from),
    to: normalizePath(to),
  }))

  const summary = {
    mode: shouldWrite ? 'write' : 'dry-run',
    articles: { created: 0, updated: 0, wouldCreate: 0, wouldUpdate: 0 },
    glossaryTerms: { created: 0, updated: 0, wouldCreate: 0, wouldUpdate: 0 },
    redirects: { created: 0, updated: 0, wouldCreate: 0, wouldUpdate: 0 },
  }

  for (const article of priorityArticles) {
    const result = await upsertArticle(payload, article, categoryIdsBySlug, shouldWrite)
    if (result === 'created') summary.articles.created++
    if (result === 'updated') summary.articles.updated++
    if (result === 'would-create') summary.articles.wouldCreate++
    if (result === 'would-update') summary.articles.wouldUpdate++
  }

  for (const term of STATIC_GLOSSARY_TERMS) {
    const result = await upsertGlossaryTerm(payload, term, shouldWrite)
    if (result === 'created') summary.glossaryTerms.created++
    if (result === 'updated') summary.glossaryTerms.updated++
    if (result === 'would-create') summary.glossaryTerms.wouldCreate++
    if (result === 'would-update') summary.glossaryTerms.wouldUpdate++
  }

  for (const redirect of glossaryRedirects) {
    const result = await upsertRedirect(payload, redirect.from, redirect.to, shouldWrite)
    if (result === 'created') summary.redirects.created++
    if (result === 'updated') summary.redirects.updated++
    if (result === 'would-create') summary.redirects.wouldCreate++
    if (result === 'would-update') summary.redirects.wouldUpdate++
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error('[sync-priority-seo-content] failed:', error)
  process.exit(1)
})
