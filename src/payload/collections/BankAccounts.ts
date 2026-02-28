import type { CollectionConfig } from 'payload'

export const BankAccounts: CollectionConfig = {
  slug: 'bank-accounts',
  admin: {
    useAsTitle: 'accountName',
    group: 'Sales',
    defaultColumns: ['accountName', 'country', 'currency', 'bankName', 'isActive'],
  },
  fields: [
    {
      name: 'accountName',
      type: 'text',
      required: true,
      admin: { description: 'Display name, e.g. "USD - HSBC Hong Kong"' },
    },
    {
      name: 'country',
      type: 'text',
      required: true,
      admin: { description: 'Country name in English, e.g. "Hong Kong", "United States"' },
    },
    {
      name: 'countryCode',
      type: 'text',
      required: true,
      admin: { description: 'ISO 3166-1 alpha-2 code, e.g. "HK", "US", "DE"' },
    },
    {
      name: 'flag',
      type: 'text',
      admin: { description: 'Flag emoji, e.g. "🇭🇰", "🇺🇸"' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      hasMany: false,
      options: [
        { label: 'USD - US Dollar', value: 'USD' },
        { label: 'HKD - Hong Kong Dollar', value: 'HKD' },
        { label: 'EUR - Euro', value: 'EUR' },
        { label: 'GBP - British Pound', value: 'GBP' },
        { label: 'CAD - Canadian Dollar', value: 'CAD' },
        { label: 'CNY - Chinese Yuan', value: 'CNY' },
        { label: 'AUD - Australian Dollar', value: 'AUD' },
        { label: 'NZD - New Zealand Dollar', value: 'NZD' },
        { label: 'SGD - Singapore Dollar', value: 'SGD' },
        { label: 'AED - UAE Dirham', value: 'AED' },
        { label: 'MXN - Mexican Peso', value: 'MXN' },
        { label: 'PHP - Philippine Peso', value: 'PHP' },
        { label: 'IDR - Indonesian Rupiah', value: 'IDR' },
        { label: 'ILS - Israeli Shekel', value: 'ILS' },
        { label: 'DKK - Danish Krone', value: 'DKK' },
      ],
    },
    {
      name: 'bankName',
      type: 'text',
      required: true,
    },
    {
      name: 'beneficiaryName',
      type: 'text',
      required: true,
    },
    {
      name: 'accountNumber',
      type: 'text',
      required: true,
      admin: { description: 'Account number, IBAN, or local account format' },
    },
    {
      name: 'localBankCode',
      type: 'text',
      admin: { description: 'Local routing code: IBAN (EU), Routing Number (US), BSB (AU), Sort Code (UK), etc.' },
    },
    {
      name: 'localBankCodeLabel',
      type: 'text',
      admin: { description: 'Label for local code, e.g. "IBAN", "Routing Number", "BSB", "Sort Code"' },
    },
    {
      name: 'swiftCode',
      type: 'text',
      admin: { description: 'SWIFT/BIC code for international transfers' },
    },
    {
      name: 'bankAddress',
      type: 'textarea',
    },
    {
      name: 'additionalInfo',
      type: 'textarea',
      admin: { description: 'Any additional payment instructions' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first' },
    },
  ],
}
