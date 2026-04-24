import { FREE_SHIPPING_THRESHOLD_USD, formatUsd } from '@/lib/shipping/rules'

export const SHIPPING_POLICY_SUMMARY = {
  liveCheckoutRates: true,
  processingTime: '1-3 business days after payment confirmation',
  freeShippingThresholdUsd: FREE_SHIPPING_THRESHOLD_USD,
  freeShippingThresholdLabel: formatUsd(FREE_SHIPPING_THRESHOLD_USD),
  calculationModel: 'base rate + overage fee + handling fee',
  methods: [
    {
      origin: 'China',
      route: 'DDP Air',
      deliveryTime: '6-15 business days',
      dutiesIncluded: true,
      description: 'Live quote at checkout, typically built from base freight plus weight overage.',
    },
    {
      origin: 'China',
      route: 'DDP Sea',
      deliveryTime: '20-35 business days',
      dutiesIncluded: true,
      description: 'Live quote at checkout, optimized for heavier international shipments.',
    },
  ],
  duties: {
    ddp: 'Customs duties and import taxes are prepaid by Machrio on DDP shipments.',
    nonDdp: 'For some express courier shipments, duties and taxes may be billed by local customs and remain the buyer responsibility.',
  },
  tracking: 'All shipments include online tracking sent by email after shipment.',
  policyPath: '/shipping-policy',
  supportEmail: 'support@machrio.com',
} as const

export const RETURN_POLICY_SUMMARY = {
  returnWindowDays: 30,
  returnWindowLabel: 'Within 30 days of delivery',
  refundProcessing: 'Refund issued within 2 business days after inspection; funds usually return within 10-15 business days.',
  returnShipping: 'Machrio covers return shipping for confirmed quality issues or wrong shipments; the customer covers non-quality returns.',
  warranty: '3-year warranty on manufacturing defects',
  regularReturn: {
    requiresUnusedProduct: true,
    originalPackagingRequired: true,
    authorizationRequired: true,
  },
  wrongItemClaimWindow: '48 hours from receipt',
  defectiveClaimWindow: '15 working days from delivery',
  policyPath: '/return-refund',
  supportEmail: 'support@machrio.com',
} as const
