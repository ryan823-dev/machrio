'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/analytics/webVitals'

/**
 * Client component that initializes Web Vitals collection.
 * Place in the frontend layout to start collecting metrics from P0.
 * Renders nothing visible — purely for side-effect initialization.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals()
  }, [])

  return null
}
