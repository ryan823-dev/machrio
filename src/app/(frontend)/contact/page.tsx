import type { Metadata } from 'next'
import { ContactForm } from '@/components/forms/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | Machrio',
  description: 'Get in touch with Machrio for customer support, sales inquiries, or business partnerships. We respond within 1 business day.',
  alternates: { canonical: '/contact/' },
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
