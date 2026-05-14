import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'
import { safeQuery } from '@/lib/db'

type Row = Record<string, any>

function isDefaultLocale(locale: Locale): boolean {
  return locale === DEFAULT_LOCALE
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function getSeoValue(row: Row, key: 'metaTitle' | 'metaDescription'): string | null {
  const snake = key === 'metaTitle' ? 'meta_title' : 'meta_description'
  const flatSnake = key === 'metaTitle' ? 'seo_meta_title' : 'seo_meta_description'
  const flatCamel = key === 'metaTitle' ? 'seo_metaTitle' : 'seo_metaDescription'
  return firstString(row[key], row[snake], row[flatSnake], row[flatCamel], row.seo?.[key])
}

async function findTranslation(tableName: string, ownerColumn: string, ownerId: string, locale: Locale): Promise<Row | null> {
  if (isDefaultLocale(locale) || !process.env.DATABASE_URI) return null

  try {
    const result = await safeQuery<Row>(
      `SELECT * FROM ${tableName}
       WHERE ${ownerColumn}::text = $1
         AND locale = $2
         AND status = 'published'
       LIMIT 1`,
      [ownerId, locale],
      0,
    )
    return result.rows[0] || null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n-content] ${tableName} lookup skipped:`, error instanceof Error ? error.message : error)
    }
    return null
  }
}

export async function applyProductTranslation<T extends Row>(product: T | null, locale: Locale): Promise<T | null> {
  if (!product?.id) return product
  const translation = await findTranslation('product_translations', 'product_id', product.id, locale)
  if (!translation) return product

  return {
    ...product,
    name: firstString(translation.name) || product.name,
    short_name: firstString(translation.short_name, translation.shortName) || product.short_name,
    shortDescription: firstString(translation.short_description, translation.shortDescription) || product.shortDescription,
    short_description: firstString(translation.short_description, translation.shortDescription) || product.short_description,
    fullDescription: translation.full_description ?? translation.fullDescription ?? product.fullDescription,
    full_description: translation.full_description ?? translation.fullDescription ?? product.full_description,
    metaTitle: getSeoValue(translation, 'metaTitle') || product.metaTitle,
    meta_title: getSeoValue(translation, 'metaTitle') || product.meta_title,
    metaDescription: getSeoValue(translation, 'metaDescription') || product.metaDescription,
    meta_description: getSeoValue(translation, 'metaDescription') || product.meta_description,
  }
}

export async function applyCategoryTranslation<T extends Row>(category: T | null, locale: Locale): Promise<T | null> {
  if (!category?.id) return category
  const translation = await findTranslation('category_translations', 'category_id', category.id, locale)
  if (!translation) return category

  return {
    ...category,
    name: firstString(translation.name) || category.name,
    shortDescription: firstString(translation.short_description, translation.shortDescription) || category.shortDescription,
    short_description: firstString(translation.short_description, translation.shortDescription) || category.short_description,
    introContent: firstString(translation.intro_content, translation.introContent) || category.introContent,
    intro_content: firstString(translation.intro_content, translation.introContent) || category.intro_content,
    description: translation.description ?? category.description,
    buyingGuide: translation.buying_guide ?? translation.buyingGuide ?? category.buyingGuide,
    buying_guide: translation.buying_guide ?? translation.buyingGuide ?? category.buying_guide,
    faq: translation.faq ?? category.faq,
    metaTitle: getSeoValue(translation, 'metaTitle') || category.metaTitle,
    meta_title: getSeoValue(translation, 'metaTitle') || category.meta_title,
    metaDescription: getSeoValue(translation, 'metaDescription') || category.metaDescription,
    meta_description: getSeoValue(translation, 'metaDescription') || category.meta_description,
  }
}

export async function applyArticleTranslation<T extends Row>(article: T | null, locale: Locale): Promise<T | null> {
  if (!article?.id) return article
  const translation = await findTranslation('article_translations', 'article_id', article.id, locale)
  if (!translation) return article

  return {
    ...article,
    title: firstString(translation.title) || article.title,
    excerpt: firstString(translation.excerpt) || article.excerpt,
    content: translation.content ?? article.content,
    quickAnswer: firstString(translation.quick_answer, translation.quickAnswer) || article.quickAnswer,
    faq: translation.faq ?? article.faq,
    metaTitle: getSeoValue(translation, 'metaTitle') || article.metaTitle,
    metaDescription: getSeoValue(translation, 'metaDescription') || article.metaDescription,
  }
}
