import type { Metadata } from 'next'
import Link from 'next/link'
import { StructuredData } from '@/components/shared/StructuredData'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://machrio.com'

export const metadata: Metadata = {
  title: 'About Us | Machrio',
  description: 'Machrio is a tools, parts, and industrial essentials platform operated by VERTAX LIMITED, offering competitive pricing, DDP global shipping, and trusted quality.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Us | Machrio',
    description: 'Machrio is a tools, parts, and industrial essentials platform operated by VERTAX LIMITED, offering competitive pricing, DDP global shipping, and trusted quality.',
  },
}

const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Machrio',
  description: 'Machrio is a B2B industrial e-commerce platform operated by VERTAX LIMITED, offering competitive pricing, DDP global shipping, and trusted quality for MRO supplies.',
  url: `${SITE_URL}/about/`,
  mainEntity: {
    '@type': 'Organization',
    name: 'Machrio',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    foundingDate: '2024',
    slogan: 'Your trusted source for tools, parts, and industrial essentials',
    description: 'B2B industrial e-commerce platform for MRO supplies — safety, adhesives, power transmission, material handling, cleaning, packaging, lighting, and tool storage.',
    parentOrganization: {
      '@type': 'Organization',
      name: 'VERTAX LIMITED',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Hong Kong',
        addressCountry: 'HK',
      },
    },
    address: [
      {
        '@type': 'PostalAddress',
        addressLocality: 'Hong Kong',
        addressCountry: 'HK',
        description: 'Registered office',
      },
      {
        '@type': 'PostalAddress',
        addressLocality: 'Shanghai',
        addressCountry: 'CN',
        description: 'Operations center and warehouse',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'support@machrio.com',
      telephone: '+1-579-300-1335',
      availableLanguage: ['English', 'Chinese'],
    },
    areaServed: 'Worldwide',
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
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'ANSI compliance' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'OSHA standards' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'RoHS/REACH compliance' },
    ],
    sameAs: [
      'https://www.linkedin.com/company/machrio',
      'https://www.facebook.com/machrio',
    ],
  },
}

export default function AboutUsPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <StructuredData data={aboutPageSchema} />
      <h1 className="text-3xl font-bold text-secondary-900">About Machrio</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Industrial procurement should be simple, transparent, and reliable. That&apos;s what we&apos;re building at Machrio.
      </p>

      {/* Mission */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Our Mission</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary-600">
          Machrio is an industrial supplies platform that helps businesses streamline the sourcing of tools, parts, and essential equipment. Whether you&apos;re a small repair shop or a growing factory, we&apos;re here to make your procurement <strong>simpler, smarter, and more efficient</strong> &mdash; through competitive pricing, trusted quality, and on-time delivery.
        </p>
      </section>

      {/* Commitments */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">What We Stand For</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-5">
            <h3 className="font-semibold text-secondary-800">Industrial-Grade Quality</h3>
            <p className="mt-2 text-sm text-secondary-600">
              Every product aligns with industry standards (ANSI, OSHA, RoHS/REACH) with traceable documentation. We emphasize durability, consistency, and safety in real-world conditions.
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-5">
            <h3 className="font-semibold text-secondary-800">Competitive Pricing</h3>
            <p className="mt-2 text-sm text-secondary-600">
              Factory-direct sourcing from China&apos;s top industrial manufacturers means lower costs without compromising on quality. Volume pricing and custom quotes available for all products.
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-5">
            <h3 className="font-semibold text-secondary-800">On-Time Delivery</h3>
            <p className="mt-2 text-sm text-secondary-600">
              Multi-warehouse coordination with both China and U.S. fulfillment options. DDP (Delivered Duty Paid) shipping ensures no hidden customs costs at your door.
            </p>
          </div>
          <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-5">
            <h3 className="font-semibold text-secondary-800">Professional Support</h3>
            <p className="mt-2 text-sm text-secondary-600">
              Dedicated B2B support with clear specifications, packaging details, ETA visibility, and standardized return processes. All customers enjoy lifetime technical assistance.
            </p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">What We Supply</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary-600">
          We focus on high-frequency, standardized MRO categories that serve businesses across industries:
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'Safety & PPE',
            'Adhesives, Sealants & Tape',
            'Cleaning & Janitorial',
            'Packaging & Shipping',
            'Casters & Material Handling',
            'Seals & Gaskets',
          ].map((cat) => (
            <li key={cat} className="flex items-center gap-2 text-sm text-secondary-700">
              <svg className="h-4 w-4 flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {cat}
            </li>
          ))}
        </ul>
      </section>

      {/* Company */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900">Company Information</h2>
        <div className="mt-4 rounded-lg border border-secondary-200 bg-secondary-50 p-5">
          <p className="text-sm text-secondary-600">
            Machrio is operated by <strong>VERTAX LIMITED</strong>, a Hong Kong registered company with operations center and warehouse facility in Shanghai, China.
          </p>
          <p className="mt-3 text-sm text-secondary-600">
            We also maintain inventory at select U.S. warehouse locations for faster domestic fulfillment.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10 rounded-lg bg-primary-50 p-8">
        <h2 className="text-xl font-semibold text-primary-900">Ready to Source Smarter?</h2>
        <p className="mt-2 max-w-2xl text-sm text-primary-700">
          Browse our growing catalog or submit a quote request &mdash; our team responds within 24 hours.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/category" className="btn-primary px-6 py-2.5 text-sm">Browse Products</Link>
          <Link href="/rfq" className="btn-accent px-6 py-2.5 text-sm">Request a Quote</Link>
        </div>
      </section>
    </div>
  )
}
