import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Machrio - Tools, Parts & Industrial Essentials',
    template: '%s | Machrio',
  },
  description:
    'Machrio is your trusted source for tools, parts, and industrial essentials. Shop online for MRO supplies, safety equipment, and maintenance products, or request a quote.',
}

// Root layout must NOT render <html>/<body> when Payload routes
// have their own RootLayout that renders these elements
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
