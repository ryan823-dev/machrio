import { GET as getMerchantFeed } from '@/app/api/merchant-feed/route'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  return getMerchantFeed()
}
