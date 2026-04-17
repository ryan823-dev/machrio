export const ORDER_ACCESS_QUERY_PARAM = 'access'

const INTERNAL_BASE_URL = 'https://machrio.local'

type QueryValue = string | number | boolean | null | undefined

export function appendQueryParamsToPath(
  path: string,
  params: Record<string, QueryValue>,
): string {
  const url = new URL(path, INTERNAL_BASE_URL)

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      url.searchParams.delete(key)
      continue
    }

    url.searchParams.set(key, String(value))
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export function buildOrderPath(
  orderNumber: string,
  accessToken?: string,
  params: Record<string, QueryValue> = {},
): string {
  return appendQueryParamsToPath(`/order/${encodeURIComponent(orderNumber)}`, {
    [ORDER_ACCESS_QUERY_PARAM]: accessToken,
    ...params,
  })
}

export function buildInvoicePath(
  orderNumber: string,
  accessToken?: string,
  params: Record<string, QueryValue> = {},
): string {
  return appendQueryParamsToPath(`/order/${encodeURIComponent(orderNumber)}/invoice`, {
    [ORDER_ACCESS_QUERY_PARAM]: accessToken,
    ...params,
  })
}

export function toAbsoluteUrl(path: string, baseUrl: string): string {
  return new URL(path, baseUrl).toString()
}
