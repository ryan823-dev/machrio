import type { Metadata } from 'next'
import { ContactForm } from '@/components/forms/ContactForm'

// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Contact Us | Machrio',
  description: 'Get in touch with Machrio for customer support, sales inquiries, or business partnerships. We respond within 1 business day.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Us | Machrio',
    description: 'Get in touch with Machrio for customer support, sales inquiries, or business partnerships. We respond within 1 business day.',
  },
}

export default function ContactPage() {
  return (
    <div className="container-main py-12">
      <h1 className="text-3xl font-bold text-secondary-900">Contact Us</h1>
      <p className="mt-2 text-secondary-600">
        Have questions? We&apos;re here to help. Reach out to us and we&apos;ll respond within 1 business day.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-semibold text-secondary-800">Get in Touch</h2>
          
          <div className="mt-6 space-y-6">
            {/* WhatsApp */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-semibold text-secondary-800">Chat with Us</h3>
              <div className="mt-3">
                <a 
                  href="https://wa.me/15793001335" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-lg bg-emerald-500 px-4 py-3 text-white transition-colors hover:bg-emerald-600"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <div>
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-sm text-emerald-100">+1 (579) 300-1335</p>
                  </div>
                </a>
                <p className="mt-2 text-sm text-secondary-500">
                  Available Mon-Fri, 9am-6pm (EST)
                </p>
              </div>
            </div>

            {/* Email Contacts */}
            <div className="rounded-lg border border-secondary-200 bg-white p-5">
              <h3 className="font-semibold text-secondary-800">Email Us</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-sm text-secondary-500">Customer Support</p>
                  <a href="mailto:support@machrio.com" className="text-primary-600 hover:text-primary-800">
                    support@machrio.com
                  </a>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Sales &amp; Quotations</p>
                  <a href="mailto:sales@machrio.com" className="text-primary-600 hover:text-primary-800">
                    sales@machrio.com
                  </a>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Business Partnership</p>
                  <a href="mailto:partner@machrio.com" className="text-primary-600 hover:text-primary-800">
                    partner@machrio.com
                  </a>
                </div>
              </div>
            </div>

            {/* Office Addresses */}
            <div className="rounded-lg border border-secondary-200 bg-white p-5">
              <h3 className="font-semibold text-secondary-800">Our Offices</h3>
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-sm font-medium text-secondary-700">Hong Kong (HQ)</p>
                  <p className="text-sm text-secondary-600">
                    UNIT B53, 2/F, KWAI SHING IND BLDG PHASE 1,<br />
                    36-40 TAI LIN PAI ROAD, KWAI CHUNG, N.T.<br />
                    HONG KONG
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-700">China</p>
                  <p className="text-sm text-secondary-600">
                    2nd Floor, No. 158 Shuanglian Road,<br />
                    Qingpu District, Shanghai, 201700<br />
                    P.R. China
                  </p>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="rounded-lg border border-secondary-200 bg-white p-5">
              <h3 className="font-semibold text-secondary-800">Company Information</h3>
              <div className="mt-3 text-sm text-secondary-600">
                <p><strong>Legal Entity:</strong> VERTAX LIMITED</p>
                <p><strong>Registered in:</strong> Hong Kong</p>
                <p className="mt-2 text-secondary-500">
                  Machrio is operated by VERTAX LIMITED, a Hong Kong registered company 
                  specializing in industrial supply chain solutions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-xl font-semibold text-secondary-800">Send Us a Message</h2>
          <p className="mt-1 text-sm text-secondary-500">
            For product quotes, please use our <a href="/rfq" className="text-primary-600 hover:underline">Request a Quote</a> page.
          </p>
          <ContactForm />
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-12 rounded-lg border border-primary-200 bg-primary-50 p-6">
        <h2 className="text-lg font-semibold text-primary-800">Looking for something specific?</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/rfq" className="btn-accent">
            Request a Quote
          </a>
          <a href="/faq" className="btn-secondary">
            FAQ
          </a>
          <a href="/shipping-policy" className="btn-secondary">
            Shipping Info
          </a>
          <a href="/return-refund" className="btn-secondary">
            Returns Policy
          </a>
        </div>
      </div>
    </div>
  )
}
