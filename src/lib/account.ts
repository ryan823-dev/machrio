const LEGACY_TOKEN_KEY = 'machrio_account_token'
const LEGACY_EMAIL_KEY = 'machrio_account_email'
const LEGACY_EXPIRY_KEY = 'machrio_account_expiry'

export function getSession(): { token: string; email: string; isValid: boolean } | null {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem(LEGACY_TOKEN_KEY)
  const email = localStorage.getItem(LEGACY_EMAIL_KEY)
  const expiry = localStorage.getItem(LEGACY_EXPIRY_KEY)

  if (!token || !email || !expiry) return null

  const isValid = new Date(expiry).getTime() > Date.now()
  if (!isValid) {
    clearSession()
    return null
  }

  return { token, email, isValid }
}

export function setSession(token: string, email: string, expiresAt: string) {
  if (typeof window === 'undefined') return

  localStorage.setItem(LEGACY_TOKEN_KEY, token)
  localStorage.setItem(LEGACY_EMAIL_KEY, email)
  localStorage.setItem(LEGACY_EXPIRY_KEY, expiresAt)
}

export function clearSession() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_EMAIL_KEY)
  localStorage.removeItem(LEGACY_EXPIRY_KEY)
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const session = getSession()

  if (session?.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers,
  })
}
