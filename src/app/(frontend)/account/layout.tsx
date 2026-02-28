import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Account | Machrio',
  description: 'View your order history, track shipments, and manage quote requests.',
  alternates: { canonical: '/account/' },
  robots: { index: false, follow: true },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
