import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Machrio Creator & Partner Program',
  description:
    'Join the Machrio creator partner program to publish industrial content, generate tracked links, and earn $10-30 per approved publication plus 3% of net sales.',
}

const benefits = [
  {
    title: '$10-30 Content Fee',
    description:
      'Every approved publication can qualify for a fixed fee based on format, depth, and technical quality.',
  },
  {
    title: '3% of Net Sales',
    description:
      'Use your own tracked link and earn commission when your audience clicks through and completes an order.',
  },
  {
    title: 'Publication-Level Tracking',
    description:
      'See which article, video, post, or landing page generated clicks, RFQs, sales, and earnings.',
  },
  {
    title: 'Industrial Buyer Fit',
    description:
      'Promote products, categories, and RFQ pages designed for industrial procurement teams and technical buyers.',
  },
]

const workflow = [
  'Apply as a creator partner and share your channels, sample work, and niche.',
  'After approval, sign in to the dashboard and generate a dedicated Machrio short link.',
  'Publish your article, video, newsletter, or social post on your own channel.',
  'Submit the publication URL so Machrio can review the content and register the placement.',
  'Track clicks, RFQs, orders, sales, content fees, and commissions from one dashboard.',
]

const metrics = [
  'Verified metrics: clicks, sessions, RFQs, orders, sales amount, estimated commission.',
  'Connected or reported metrics: impressions, views, likes, comments, and channel-side analytics.',
  'Attribution model: last partner click within 30 days.',
  'Commission basis: 3% of net sales after cancellations and refunds.',
]

export default function PartnerProgramPage() {
  return (
    <div className="bg-gradient-to-b from-secondary-50 via-white to-white">
      <section className="container-main py-14">
        <div className="rounded-[2rem] bg-secondary-900 px-8 py-12 text-white shadow-xl md:px-12">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Machrio Creator & Partner Platform
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Turn Industrial Content Into Trackable Revenue
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-secondary-200">
                Join Machrio as a creator partner, publish content on your own website or channel, attach tracked links to Machrio products or RFQ pages, and get paid on both content delivery and closed sales.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/partner-program/apply" className="btn-accent rounded-xl px-6 py-3">
                  Apply to Join
                </Link>
                <Link href="/partner/dashboard" className="btn-secondary rounded-xl px-6 py-3 border-white/20 bg-white/10 text-white hover:bg-white/20">
                  Open Dashboard
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 text-sm text-secondary-100">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary-300">What You Can Promote</p>
              <ul className="mt-4 space-y-3">
                <li>Product pages</li>
                <li>Category pages</li>
                <li>Brand pages</li>
                <li>RFQ pages for high-value demand</li>
                <li>Topic and campaign landing pages</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container-main pb-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-secondary-900">{item.title}</h2>
              <p className="mt-3 text-secondary-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-main py-12">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-primary-700">How It Works</p>
            <ol className="mt-5 space-y-4 text-secondary-700">
              {workflow.map((item, index) => (
                <li key={item} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-primary-700">Tracking Model</p>
            <ul className="mt-5 space-y-4 text-secondary-700">
              {metrics.map((item) => (
                <li key={item} className="flex gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
              External impressions are not universally verifiable across every platform. Machrio separates platform-verified outcomes such as clicks, RFQs, and orders from channel-side metrics such as impressions and views.
            </div>
          </div>
        </div>
      </section>

      <section className="container-main pb-14">
        <div className="rounded-3xl border border-secondary-200 bg-white p-8 shadow-sm md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-secondary-900">Ready to Build Your Partner Pipeline?</h2>
              <p className="mt-3 max-w-2xl text-secondary-600">
                The first MVP already supports partner application, dashboard sign-in, short-link generation, publication submission, click attribution, RFQ attribution, order attribution, and commission visibility.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/partner-program/apply" className="btn-accent rounded-xl px-6 py-3">
                Apply Now
              </Link>
              <Link href="/partner-program/terms" className="btn-secondary rounded-xl px-6 py-3">
                View Terms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
