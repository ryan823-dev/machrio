import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createPool } from '@/lib/db'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { FAQSchema, FAQSection } from '@/components/shared/FAQSchema'
import { StructuredData } from '@/components/shared/StructuredData'
import { CategoryBuyingGuide } from '@/components/shared/RelatedGuide'
import { ProductGrid } from '@/components/category/ProductGrid'
import { ExpandableIntro } from '@/components/category/ExpandableIntro'
import { EmptyStateAIDialog } from '@/components/category/EmptyStateAIDialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function extractChildren(children: unknown[]): string {
  if (!Array.isArray(children)) return ''
  return children
    .map((node) => {
      const n = node as Record<string, unknown>
      if (n.type === 'text') return n.text as string
      if (n.children) return extractChildren(n.children as unknown[])
      return ''
    })
    .join('')
}

function lexicalToHtml(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return ''
  return (root.children as Record<string, unknown>[])
    .map((node) => {
      if (node.type === 'paragraph') {
        const text = extractChildren(node.children as unknown[])
        return text ? `<p>${text}</p>` : ''
      }
      if (node.type === 'heading') {
        const tag = (node.tag as string) || 'h3'
        const text = extractChildren(node.children as unknown[])
        return text ? `<${tag}>${text}</${tag}>` : ''
      }
      if (node.type === 'list') {
        const listTag = node.listType === 'number' ? 'ol' : 'ul'
        const items = (node.children as Record<string, unknown>[])
          .map((item) => {
            const text = extractChildren(item.children as unknown[])
            return text ? `<li>${text}</li>` : ''
          })
          .filter(Boolean)
          .join('')
        return items ? `<${listTag}>${items}</${listTag}>` : ''
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

function hasRichTextContent(richText: unknown): boolean {
  if (!richText || typeof richText !== 'object') return false
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return false
  const text = extractChildren(root.children as unknown[])
  return text.trim().length > 0
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

const PRODUCTS_PER_PAGE = 24

async function getCategoryData(slug: string) {
  const pool = createPool()
  try {
    const catResult = await pool.query(
      `SELECT id::text, name, slug, short_description, intro_content, description, buying_guide,
              parent_id::text, display_order
       FROM categories WHERE slug = $1`,
      [slug]
    )
    if (catResult.rows.length === 0) return null
    const category = catResult.rows[0]

    let parent = null
    let grandparent = null
    if (category.parent_id) {
      const parentResult = await pool.query(
        `SELECT id::text, name, slug, parent_id::text FROM categories WHERE id = $1::uuid`,
        [category.parent_id]
      )
      parent = parentResult.rows[0]
      if (parent?.parent_id) {
        const gpResult = await pool.query(
          `SELECT id::text, name, slug FROM categories WHERE id = $1::uuid`,
          [parent.parent_id]
        )
        grandparent = gpResult.rows[0]
      }
    }

    const childrenResult = await pool.query(
      `SELECT id::text, name, slug FROM categories WHERE parent_id = $1::uuid ORDER BY display_order LIMIT 50`,
      [category.id]
    )
    return { category, parent, grandparent, children: childrenResult.rows }
  } catch (error) {
    console.error('[getCategoryData] 错误:', error)
    return null
  }
}

async function getCategoryProducts(categoryId: string, page: number, sort: string) {
  const pool = createPool()
  try {
    const offset = (page - 1) * PRODUCTS_PER_PAGE

    let orderBy = 'created_at DESC'
    if (sort === '-createdAt') orderBy = 'created_at DESC'
    else if (sort === 'createdAt') orderBy = 'created_at ASC'
    else if (sort === '-name') orderBy = 'name DESC'
    else if (sort === 'name') orderBy = 'name ASC'

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE primary_category_id::text = $1',
      [categoryId]
    )
    const totalDocs = parseInt(countResult.rows[0].count)

    const productsResult = await pool.query(
      `SELECT id, name, slug, sku, short_description, external_image_url
       FROM products
       WHERE primary_category_id::text = $1
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [categoryId, PRODUCTS_PER_PAGE, offset]
    )

    const products = productsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      shortDescription: row.short_description,
      primaryImage: row.external_image_url,
      pricing: { basePrice: null, currency: 'USD' },
    }))

    return {
      docs: products,
      totalDocs,
      page,
      totalPages: Math.ceil(totalDocs / PRODUCTS_PER_PAGE),
      hasNextPage: offset + PRODUCTS_PER_PAGE < totalDocs,
      hasPrevPage: page > 1,
    }
  } catch (error) {
    console.error('[getCategoryProducts] 错误:', error)
    return {
      docs: [],
      totalDocs: 0,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getCategoryData(slug)
  if (!data) return { title: 'Category Not Found' }

  const { category, parent, grandparent } = data
  const parentName = parent ? `${parent.name} - ` : ''
  const gpName = grandparent ? `${grandparent.name} - ` : ''
  const title = `${category.name} | ${gpName}${parentName}Machrio Industrial Supplies`
  const description = category.shortDescription || `Browse ${category.name} at Machrio.`

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}/` },
    openGraph: { title, description },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const data = await getCategoryData(slug)
  if (!data) notFound()

  const { category, parent, grandparent, children } = data
  const isL1 = !parent && !grandparent
  const isL2 = !!parent && !grandparent
  const isL3 = !!parent && !!grandparent

  let productsResult = { docs: [], totalDocs: 0, page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false }
  const isLeafCategory = children.length === 0
  if (isL3 || isLeafCategory) {
    productsResult = await getCategoryProducts(category.id, 1, '-createdAt')
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    ...(grandparent ? [{ label: grandparent.name, href: `/category/${grandparent.slug}` }] : []),
    ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []),
    { label: category.name },
  ]

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

  const itemListSchema = productsResult.docs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} - Industrial Supplies`,
    numberOfItems: productsResult.totalDocs,
    itemListElement: productsResult.docs.slice(0, 20).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${serverUrl}/product/${category.slug}/${p.slug}/`,
      name: p.name,
    })),
  } : null

  return (
    <div className="container-main pb-12">
      <Breadcrumbs items={breadcrumbs} />
      {itemListSchema && <StructuredData data={itemListSchema} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{category.name}</h1>
        {category.introContent ? (
          <ExpandableIntro content={category.introContent as string} />
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-secondary-600">
            {category.shortDescription || `Browse our selection of ${category.name} products.`}
          </p>
        )}
      </div>

      <CategoryBuyingGuide categorySlug={slug} />

      {(isL1 || isL2) && children.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-secondary-800">
            Browse {category.name} Categories
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                className="rounded-lg border border-secondary-200 bg-white px-4 py-4 text-center text-sm font-medium text-secondary-700 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {(isL1 || isL2) && children.length === 0 && (
        <EmptyStateAIDialog
          categoryName={category.name}
          categorySlug={slug}
          parentCategories={parent ? [parent.name] : []}
        />
      )}

      {isL3 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-secondary-500">{productsResult.totalDocs} products</p>
          </div>

          {productsResult.docs.length > 0 ? (
            <Suspense fallback={<div className="h-96 animate-pulse rounded bg-secondary-100" />}>
              <ProductGrid products={productsResult.docs} view="list" />
            </Suspense>
          ) : (
            <EmptyStateAIDialog
              categoryName={category.name}
              categorySlug={slug}
              parentCategories={[grandparent?.name, parent?.name].filter(Boolean) as string[]}
            />
          )}
        </>
      )}

      {productsResult.totalDocs > 0 && (
        <section className="mt-12 border-t border-secondary-200 pt-8">
          {hasRichTextContent(category.description) && (
            <div className="mb-10">
              <div className="prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.description) }} />
            </div>
          )}
          {hasRichTextContent(category.buyingGuide) && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-secondary-900">How to Choose the Right {category.name}</h2>
              <div className="prose prose-sm prose-secondary max-w-none text-secondary-600" dangerouslySetInnerHTML={{ __html: lexicalToHtml(category.buyingGuide) }} />
            </div>
          )}
          {Array.isArray(category.faq) && category.faq.length > 0 && (
            <FAQSection faqs={category.faq.map((item: { question?: string; answer?: string }) => ({ question: item.question || '', answer: item.answer || '' }))} title="Frequently Asked Questions" />
          )}
        </section>
      )}

      {Array.isArray(category.faq) && category.faq.length > 0 && (
        <FAQSchema faqs={category.faq.map((item: { question?: string; answer?: string }) => ({ question: item.question || '', answer: item.answer || '' }))} />
      )}
    </div>
  )
}