import Link from 'next/link'

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Clearance & Duties', href: '/clearance-duties' },
  ],
  industries: [
    { label: 'Manufacturing', href: '/industry/manufacturing' },
    { label: 'Construction', href: '/industry/construction' },
    { label: 'Automotive', href: '/industry/automotive' },
    { label: 'Healthcare', href: '/industry/healthcare' },
    { label: 'Food & Beverage', href: '/industry/food-beverage' },
    { label: 'Warehouse & Logistics', href: '/industry/warehouse' },
  ],
  support: [
    { label: 'How To Order', href: '/how-to-order' },
    { label: 'Payment Methods', href: '/payment-methods' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Return & Refund', href: '/return-refund' },
    { label: 'FAQ', href: '/faq' },
  ],
  services: [
    { label: 'Request a Quote', href: '/rfq' },
    { label: 'Browse Products', href: '/category' },
    { label: 'Knowledge Center', href: '/knowledge-center' },
  ],
  legal: [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-secondary-200 bg-secondary-900 text-secondary-300">
      <div className="container-main py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-bold text-white">
              Mach<span className="text-amber-400">rio</span>
            </span>
            <p className="mt-3 text-sm leading-relaxed">
              Your trusted source for tools, parts, and industrial essentials with transparent pricing, DDP global shipping, and lifetime technical support.
            </p>
            <p className="mt-3 text-xs text-secondary-400">
              Operated by VERTAX LIMITED, Hong Kong.
            </p>
            <div className="mt-3">
              <a href="mailto:sales@machrio.com" className="text-sm font-medium text-white hover:text-amber-400">
                sales@machrio.com
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">About Machrio</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Industries</h3>
            <ul className="space-y-2">
              {footerLinks.industries.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Customer Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Business Services</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust Signals */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Shop With Confidence</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                3-Year Warranty
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                30-Day Returns
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                DDP Duty-Free Shipping
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secure Checkout
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between border-t border-secondary-700 pt-6 sm:flex-row">
          <p className="text-xs">&copy; {new Date().getFullYear()} Machrio.com. Operated by VERTAX LIMITED.</p>
          <div className="mt-2 flex gap-4 sm:mt-0">
            {footerLinks.legal.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
