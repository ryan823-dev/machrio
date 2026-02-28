import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Machrio',
  description: 'Machrio privacy policy - how we collect, use, protect, and disclose your personal information.',
  alternates: { canonical: '/privacy/' },
  openGraph: {
    title: 'Privacy Policy | Machrio',
    description: 'Machrio privacy policy - how we collect, use, protect, and disclose your personal information.',
  },
}

export default function PrivacyPage() {
  return (
    <div className="container-main pb-16 pt-8">
      <h1 className="text-3xl font-bold text-secondary-900">Privacy Policy</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary-600">
        Welcome to Machrio (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, protect, and disclose the data you provide when interacting with our website and services.
      </p>

      <div className="mt-10 max-w-3xl space-y-8 text-sm leading-relaxed text-secondary-600">
        <section>
          <h2 className="text-lg font-semibold text-secondary-900">Data Security</h2>
          <p className="mt-3">We take data protection seriously. Your personal and payment information is secured through:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>SSL (Secure Socket Layer) encryption for safe data transmission</li>
            <li>Restricted access to authorized personnel only</li>
            <li>Firewalls and continuous monitoring</li>
            <li>Regular security audits and system updates</li>
            <li>Employee training on data protection best practices</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">Information We Collect</h2>
          <p className="mt-3">We only collect information necessary to process your orders, provide support, and comply with legal obligations. We do not collect personal data for resale or advertising purposes.</p>
          <p className="mt-2">Information we may collect includes:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Full name and contact details (email, phone number, shipping address)</li>
            <li>Login credentials (username and password)</li>
            <li>IP address, device, and browser information</li>
            <li>Website usage and interaction data</li>
          </ul>
          <p className="mt-2">This data may be collected when you create an account, place an order, contact customer support, or subscribe to updates.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">How We Use Your Information</h2>
          <p className="mt-3">Your data is used solely to provide and improve our services, including:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Processing and fulfilling orders</li>
            <li>Shipping and delivery coordination</li>
            <li>Communicating about your account or purchases</li>
            <li>Responding to inquiries or support requests</li>
            <li>Improving our website functionality and services</li>
            <li>Complying with regulatory or legal requirements</li>
            <li>Sending marketing communications (if you have opted in, with the option to unsubscribe anytime)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">Your Privacy Rights</h2>
          <p className="mt-3">Depending on your location and applicable law, you may have the right to:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Access or request deletion of your personal data</li>
            <li>Correct or update inaccurate information</li>
            <li>Withdraw consent for marketing communications</li>
            <li>Request restriction or portability of your data</li>
          </ul>
          <p className="mt-2">To make a request, please contact us at <strong>support@machrio.com</strong>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">Cookies and Tracking</h2>
          <p className="mt-3">We use cookies to improve your browsing experience, including:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Saving items in your shopping cart</li>
            <li>Remembering your login/session preferences</li>
            <li>Analyzing website traffic and performance</li>
          </ul>
          <p className="mt-2">You can manage or disable cookies through your browser settings.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">Information Sharing</h2>
          <p className="mt-3">We do not sell, rent, or trade your personal information. We only share data with trusted third parties when necessary, such as:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Payment processors (Stripe)</li>
            <li>Logistics and shipping providers</li>
            <li>IT and website maintenance partners</li>
            <li>Government authorities when required by law</li>
          </ul>
          <p className="mt-2">All third parties handling your data are contractually bound to maintain confidentiality and follow strict data protection standards.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">Data Retention</h2>
          <p className="mt-3">
            We retain your personal information only as long as necessary to complete transactions, meet regulatory obligations, and support legitimate business interests (e.g., fraud prevention, dispute resolution). After this period, your data will be securely deleted or anonymized.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary-900">Governing Law</h2>
          <p className="mt-3">
            This Privacy Policy will be interpreted and applied in accordance with the laws of Hong Kong SAR and applicable international data protection regulations relevant to your location.
          </p>
        </section>

        <section className="rounded-lg bg-secondary-50 border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-800">Contact Us</h3>
          <p className="mt-2">
            If you have questions, concerns, or requests related to this Privacy Policy:<br />
            Email: <strong>support@machrio.com</strong><br />
            Operated by VERTAX LIMITED, Hong Kong.
          </p>
        </section>
      </div>
    </div>
  )
}
