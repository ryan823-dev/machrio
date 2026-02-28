import type { Metadata } from 'next'
import Script from 'next/script'
import '@/styles/globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AIAssistant } from '@/components/shared/AIAssistant'
import { CartProvider } from '@/contexts/CartContext'
import { AIAssistantVisibilityProvider } from '@/contexts/AIAssistantVisibilityContext'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.machrio.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Machrio',
    images: [
      {
        url: '/og-image.png',
        width: 1792,
        height: 1024,
        alt: 'Machrio - Tools, Parts & Industrial Essentials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// WebSite + SearchAction schema for sitelinks search box
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Machrio',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

// Organization schema for site-level entity recognition (AEO + Knowledge Graph)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Machrio',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'B2B industrial e-commerce platform for MRO supplies — safety, adhesives, power transmission, material handling, cleaning, packaging, lighting, and tool storage for manufacturing, construction, automotive, healthcare, food & beverage, and warehouse operations.',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'sales@machrio.com',
      availableLanguage: ['English', 'Chinese'],
    },
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@machrio.com',
      availableLanguage: ['English', 'Chinese'],
    },
  ],
  areaServed: { '@type': 'Place', name: 'Worldwide' },
  knowsAbout: [
    'MRO supplies',
    'industrial safety equipment',
    'PPE',
    'adhesives and sealants',
    'power transmission components',
    'material handling equipment',
    'industrial cleaning products',
    'packaging and shipping supplies',
    'B2B procurement',
    'industrial maintenance',
  ],
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <div className="flex min-h-screen flex-col">
          <CartProvider>
            <AIAssistantVisibilityProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <AIAssistant />
            </AIAssistantVisibilityProvider>
          </CartProvider>
        </div>
      </body>
    </html>
  )
}
