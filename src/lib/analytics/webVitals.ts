import type { Metric } from 'web-vitals'

type ReportCallback = (metric: Metric) => void

/**
 * Web Vitals monitoring for P0.
 * Collects CLS, LCP, INP (replacing FID) from real user sessions.
 * Initially logs to console; can be extended to send to GA4 or custom endpoint.
 */
export function reportWebVitals(onReport?: ReportCallback) {
  const callback: ReportCallback = onReport || logMetric

  // Dynamic import to avoid increasing bundle size for non-supporting browsers
  import('web-vitals').then(({ onCLS, onLCP, onINP, onFCP, onTTFB }) => {
    onCLS(callback)
    onLCP(callback)
    onINP(callback)
    onFCP(callback)
    onTTFB(callback)
  })
}

function logMetric(metric: Metric) {
  // Log to console in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`, {
      id: metric.id,
      rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
      delta: metric.delta,
      navigationType: metric.navigationType,
    })
    return
  }

  // Production: send to GA4 via gtag if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag
    gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
}
