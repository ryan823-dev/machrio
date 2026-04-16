import Link from 'next/link'

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Partner Program', href: '/partner-program' },
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
    { label: 'Partner Dashboard', href: '/partner/dashboard' },
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <span className="text-xl font-bold text-white">
              Mach<span className="text-amber-400">rio</span>
            </span>
            <p className="mt-3 text-sm leading-relaxed">
              Your trusted source for tools, parts, and industrial essentials with transparent pricing, DDP global shipping, and lifetime technical support.
            </p>
            <p className="mt-3 text-xs text-secondary-400">
              Operated by VERTAX LIMITED, Hong Kong.
            </p>
            <div className="mt-3 space-y-2">
              <a href="mailto:sales@machrio.com" className="block text-sm font-medium text-white hover:text-amber-400">
                sales@machrio.com
              </a>
              <a 
                href="https://wa.me/15793001335" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-emerald-400"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                +1 (579) 300-1335
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
