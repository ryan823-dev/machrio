import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload/payload.config'

const LOCALES = ['vi', 'th', 'id'] as const

type Locale = (typeof LOCALES)[number]
type PayloadClient = Awaited<ReturnType<typeof getPayload>>
type GenericDoc = Record<string, any>

const PRODUCT_LIMIT = Number.parseInt(process.env.TRANSLATION_PRODUCT_LIMIT || '100', 10)
const CATEGORY_LIMIT = Number.parseInt(process.env.TRANSLATION_CATEGORY_LIMIT || '50', 10)
const ARTICLE_LIMIT = Number.parseInt(process.env.TRANSLATION_ARTICLE_LIMIT || '30', 10)

function draftPrefix(locale: Locale): string {
  return `[${locale.toUpperCase()} DRAFT - localize before publishing]`
}

function richTextFromPlainText(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [{ type: 'text', text, version: 1 }],
        },
      ],
    },
  }
}

async function exists(
  payload: PayloadClient,
  collection: string,
  relationField: string,
  id: string,
  locale: Locale,
) {
  const result = await (payload.find as any)({
    collection,
    limit: 1,
    depth: 0,
    where: {
      and: [
        { [relationField]: { equals: id } },
        { locale: { equals: locale } },
      ],
    },
  })

  return result.docs.length > 0
}

async function createCategoryDrafts(payload: PayloadClient) {
  const categories = await payload.find({
    collection: 'categories',
    limit: CATEGORY_LIMIT,
    depth: 0,
    sort: 'displayOrder',
  })

  let created = 0

  for (const category of categories.docs as GenericDoc[]) {
    for (const locale of LOCALES) {
      if (await exists(payload, 'category-translations', 'category', category.id, locale)) continue

      await (payload.create as any)({
        collection: 'category-translations',
        data: {
          category: category.id,
          locale,
          status: 'draft',
          name: `${draftPrefix(locale)} ${category.name || category.slug}`,
          shortDescription: category.shortDescription || category.short_description || '',
          introContent: category.introContent || category.intro_content || '',
          description: category.description || richTextFromPlainText(category.shortDescription || category.name || ''),
          buyingGuide: category.buyingGuide || category.buying_guide || undefined,
          faq: category.faq || [],
          seo: {
            metaTitle: category.seo?.metaTitle || category.metaTitle || category.name || '',
            metaDescription: category.seo?.metaDescription || category.metaDescription || category.shortDescription || '',
          },
        },
      })
      created += 1
    }
  }

  return created
}

async function createProductDrafts(payload: PayloadClient) {
  const products = await payload.find({
    collection: 'products',
    limit: PRODUCT_LIMIT,
    depth: 0,
    sort: '-updatedAt',
    where: {
      status: {
        equals: 'published',
      },
    },
  })

  let created = 0

  for (const product of products.docs as GenericDoc[]) {
    for (const locale of LOCALES) {
      if (await exists(payload, 'product-translations', 'product', product.id, locale)) continue

      await (payload.create as any)({
        collection: 'product-translations',
        data: {
          product: product.id,
          locale,
          status: 'draft',
          name: `${draftPrefix(locale)} ${product.name || product.sku}`,
          shortName: product.shortName || product.short_name || '',
          shortDescription: product.shortDescription || product.short_description || product.name || '',
          fullDescription: product.fullDescription || product.full_description || richTextFromPlainText(product.shortDescription || product.name || ''),
          seo: {
            metaTitle: product.seo?.metaTitle || product.metaTitle || product.name || '',
            metaDescription: product.seo?.metaDescription || product.metaDescription || product.shortDescription || product.short_description || '',
          },
        },
      })
      created += 1
    }
  }

  return created
}

async function createArticleDrafts(payload: PayloadClient) {
  const articles = await payload.find({
    collection: 'articles',
    limit: ARTICLE_LIMIT,
    depth: 0,
    sort: '-publishedAt',
    where: {
      status: {
        equals: 'published',
      },
    },
  })

  let created = 0

  for (const article of articles.docs as GenericDoc[]) {
    for (const locale of LOCALES) {
      if (await exists(payload, 'article-translations', 'article', article.id, locale)) continue

      await (payload.create as any)({
        collection: 'article-translations',
        data: {
          article: article.id,
          locale,
          status: 'draft',
          title: `${draftPrefix(locale)} ${article.title || article.slug}`,
          excerpt: article.excerpt || article.description || '',
          content: article.content || richTextFromPlainText(article.excerpt || article.title || ''),
          quickAnswer: article.quickAnswer || '',
          faq: article.faq || [],
          seo: {
            metaTitle: article.seo?.metaTitle || article.metaTitle || article.title || '',
            metaDescription: article.seo?.metaDescription || article.metaDescription || article.excerpt || '',
          },
        },
      })
      created += 1
    }
  }

  return created
}

async function main() {
  const payload = await getPayload({ config })

  const [categories, products, articles] = await Promise.all([
    createCategoryDrafts(payload),
    createProductDrafts(payload),
    createArticleDrafts(payload),
  ])

  console.log('Translation draft creation complete.')
  console.log(`Category drafts created: ${categories}`)
  console.log(`Product drafts created: ${products}`)
  console.log(`Article drafts created: ${articles}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
