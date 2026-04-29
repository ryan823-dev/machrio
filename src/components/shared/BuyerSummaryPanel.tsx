interface BuyerSummarySection {
  title: string
  items: string[]
}

interface BuyerSummaryPanelProps {
  eyebrow: string
  title: string
  answer: string
  sections: BuyerSummarySection[]
  className?: string
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-secondary-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function BuyerSummaryPanel({
  eyebrow,
  title,
  answer,
  sections,
  className = '',
}: BuyerSummaryPanelProps) {
  const visibleSections = sections.filter((section) => section.items.length > 0)

  if (!answer.trim() || visibleSections.length === 0) {
    return null
  }

  return (
    <section
      className={`rounded-2xl border border-secondary-200 bg-gradient-to-br from-white via-primary-50/50 to-white p-6 shadow-sm lg:p-8 ${className}`.trim()}
    >
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-bold text-secondary-900">
          {title}
        </h2>
        <p data-speakable="summary" className="mt-4 text-sm leading-7 text-secondary-700">
          {answer}
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {visibleSections.map((section) => (
          <div key={section.title} className="rounded-xl border border-secondary-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-secondary-900">{section.title}</h3>
            <div className="mt-4">
              <BulletList items={section.items} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
