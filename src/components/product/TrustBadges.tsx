export function TrustBadges() {
  const badges = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: 'Free Shipping $200+',
      subtitle: 'On qualifying orders',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Fast DDP Delivery',
      subtitle: 'Door-to-door service',
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: '24/7 Support',
      subtitle: 'Expert assistance',
    },
  ]

  return (
    <div className="mt-6 grid grid-cols-3 gap-2">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex flex-col items-center rounded-lg border border-secondary-200 bg-secondary-50 p-3 text-center"
        >
          <div className="text-primary-600">{badge.icon}</div>
          <p className="mt-1.5 text-xs font-semibold text-secondary-800">{badge.title}</p>
          <p className="text-[10px] text-secondary-500">{badge.subtitle}</p>
        </div>
      ))}
    </div>
  )
}
