const TOKEN_KEY = 'machrio_account_token'
const EMAIL_KEY = 'machrio_account_email'
const EXPIRY_KEY = 'machrio_account_expiry'

export function getSession(): { token: string; email: string; isValid: boolean } | null {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem(TOKEN_KEY)
  const email = localStorage.getItem(EMAIL_KEY)
  const expiry = localStorage.getItem(EXPIRY_KEY)

  if (!token || !email || !expiry) return null

  const isValid = new Date(expiry).getTime() > Date.now()
  if (!isValid) {
    clearSession()
    return null
  }

  return { token, email, isValid }
}

export function setSession(token: string, email: string, expiresAt: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EMAIL_KEY, email)
  localStorage.setItem(EXPIRY_KEY, expiresAt)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const session = getSession()
  if (!session) throw new Error('No active session')

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.token}`,
    },
  })
}
