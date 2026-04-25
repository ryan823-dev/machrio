export const SUPPORT_EMAIL = 'support@machrio.com'

export const DEFAULT_FROM_EMAIL = `Machrio <${SUPPORT_EMAIL}>`

export function getFromEmail(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM_EMAIL
}

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || process.env.RFQ_NOTIFICATION_EMAIL || SUPPORT_EMAIL
}
