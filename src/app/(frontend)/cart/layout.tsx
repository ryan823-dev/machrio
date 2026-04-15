import type { Metadata } from 'next'
import { withBrandSuffix } from '@/lib/seo'

export const metadata: Metadata = {
  title: withBrandSuffix('Shopping Cart'),
  description: 'Review items in your cart before checkout or requesting a quote.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: false },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
