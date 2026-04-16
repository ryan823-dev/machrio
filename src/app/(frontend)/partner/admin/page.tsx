import type { Metadata } from 'next'
import { PartnerAdminDashboard } from '@/components/partner/PartnerAdminDashboard'

export const metadata: Metadata = {
  title: 'Partner Admin Overview | Machrio',
  description:
    'Internal admin overview for Machrio creator partners, applications, publication performance, and partner-attributed sales.',
}

export default function PartnerAdminPage() {
  return <PartnerAdminDashboard />
}
