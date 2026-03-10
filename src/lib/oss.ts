import OSS from 'ali-oss'
import crypto from 'crypto'

let client: OSS | null = null

function getOSSClient(): OSS {
  if (client) return client

  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID?.trim()
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET?.trim()
  const bucket = process.env.ALIYUN_OSS_BUCKET?.trim()
  const endpoint = process.env.ALIYUN_OSS_ENDPOINT?.trim()

  if (!accessKeyId || !accessKeySecret || !bucket || !endpoint) {
    throw new Error('Missing Aliyun OSS environment variables. Required: ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET, ALIYUN_OSS_BUCKET, ALIYUN_OSS_ENDPOINT')
  }

  console.log('[OSS] Bucket name:', JSON.stringify(bucket), 'Length:', bucket.length)

  // Validate bucket name format
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new Error(`Invalid bucket name: "${bucket}". Bucket name must be 3-63 chars, lowercase letters, numbers, and hyphens only.`)
  }

  console.log('[OSS] Creating client with endpoint:', endpoint, 'bucket:', bucket)

  // For Aliyun OSS, use endpoint directly
  client = new OSS({
    accessKeyId,
    accessKeySecret,
    bucket,
    endpoint,
  })

  return client
}

/**
 * Sanitize filename: lowercase, replace non-alphanumeric with hyphens, trim, max 50 chars
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '') // remove extension
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

/**
 * Upload a buffer to Aliyun OSS and return the public CDN URL.
 */
export async function uploadToOSS(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const ossClient = getOSSClient()
  const bucket = process.env.ALIYUN_OSS_BUCKET!
  const endpoint = process.env.ALIYUN_OSS_ENDPOINT || `https://${process.env.ALIYUN_OSS_REGION}.aliyuncs.com`

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '.jpg'
  const safeName = sanitizeFilename(filename)
  const shortId = crypto.randomBytes(2).toString('hex')

  const ossPath = `products/${year}/${month}/${safeName}-${shortId}${ext}`

  await ossClient.put(ossPath, buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })

  // Return the public URL
  // endpoint is like https://oss-us-west-1.aliyuncs.com
  // public URL format: https://{bucket}.{endpoint-host}/{path}
  const endpointHost = endpoint.replace('https://', '').replace('http://', '')
  const url = `https://${bucket}.${endpointHost}/${ossPath}`
  return url
}
