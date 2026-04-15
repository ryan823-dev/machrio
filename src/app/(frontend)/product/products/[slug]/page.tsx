import { notFound, permanentRedirect } from 'next/navigation'
import { getProductBySlug } from '@/lib/db-queries'
import { getCanonicalProductCategory } from '@/lib/seo'

export const dynamic = 'force-dynamic'

interface LegacyProductRedirectPageProps {
  params: Promise<{ slug: string }>
}

export default async function LegacyProductRedirectPage({
  params,
}: LegacyProductRedirectPageProps) {
  const { slug } = await params
  const { product } = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const canonicalCategory = getCanonicalProductCategory({
    name: product.name,
    slug: product.slug,
    categorySlug: product.category_slug,
    categoryName: product.category_name,
  })

  permanentRedirect(`/product/${canonicalCategory.slug}/${product.slug}`)
}
