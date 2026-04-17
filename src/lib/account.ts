const LEGACY_TOKEN_KEY = 'machrio_account_token'
const LEGACY_EMAIL_KEY = 'machrio_account_email'
const LEGACY_EXPIRY_KEY = 'machrio_account_expiry'

export function clearSession() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(LEGACY_TOKEN_KEY)
  localStorage.removeItem(LEGACY_EMAIL_KEY)
  localStorage.removeItem(LEGACY_EXPIRY_KEY)
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...options.headers,
    },
  })
}
