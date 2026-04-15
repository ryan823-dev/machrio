import type { Metadata } from 'next'
import { withBrandSuffix } from '@/lib/seo'

export const metadata: Metadata = {
  title: withBrandSuffix('Checkout'),
  description: 'Complete your order securely with card, PayPal, or bank transfer.',
  alternates: { canonical: '/checkout' },
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
