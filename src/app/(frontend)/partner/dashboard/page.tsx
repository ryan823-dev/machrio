import type { Metadata } from 'next'
import { PartnerDashboard } from '@/components/partner/PartnerDashboard'

export const metadata: Metadata = {
  title: 'Partner Dashboard | Machrio',
  description:
    'Sign in to the Machrio partner dashboard to generate tracked links, register publications, and monitor clicks, RFQs, orders, sales, and commissions.',
}

export default function PartnerDashboardPage() {
  return <PartnerDashboard />
}
