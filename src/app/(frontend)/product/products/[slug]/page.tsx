import { notFound, permanentRedirect } from 'next/navigation'
import { getProductBySlug } from '@/lib/db-queries'
import { getCanonicalProductCategory } from '@/lib/seo'
import { resolveProductPath } from '@/lib/url-resolution'

export const dynamic = 'force-dynamic'

interface LegacyProductRedirectPageProps {
  params: Promise<{ slug: string }>
}

export default async function LegacyProductRedirectPage({
  params,
}: LegacyProductRedirectPageProps) {
  const { slug } = await params
  const { product } = await getProductBySlug(slug)
  const legacyPath = `/product/products/${slug}`

  if (!product) {
    const resolution = await resolveProductPath(legacyPath, 'products', slug)

    if (resolution.redirectTo) {
      permanentRedirect(resolution.redirectTo)
    }

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
