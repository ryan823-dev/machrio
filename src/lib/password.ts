import crypto from 'crypto'
const SCRYPT_KEY_LENGTH = 64
const SCRYPT_COST = 16384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1

function scryptAsync(password: string, salt: string, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      keyLength,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error)
          return
        }

        resolve(derivedKey)
      },
    )
  })
}

export function getPasswordValidationError(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.'
  }

  if (!/[A-Za-z]/.test(password)) {
    return 'Password must include at least one letter.'
  }

  if (!/\d/.test(password)) {
    return 'Password must include at least one number.'
  }

  return null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)

  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt,
    derivedKey.toString('hex'),
  ].join('$')
}

export async function verifyPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash) return false

  const [algorithm, cost, blockSize, parallelization, salt, hash] = storedHash.split('$')
  if (
    algorithm !== 'scrypt'
    || !cost
    || !blockSize
    || !parallelization
    || !salt
    || !hash
  ) {
    return false
  }

  if (
    Number(cost) !== SCRYPT_COST
    || Number(blockSize) !== SCRYPT_BLOCK_SIZE
    || Number(parallelization) !== SCRYPT_PARALLELIZATION
  ) {
    return false
  }

  const derivedKey = await scryptAsync(password, salt, hash.length / 2)

  const storedBuffer = Buffer.from(hash, 'hex')
  return storedBuffer.length === derivedKey.length
    && crypto.timingSafeEqual(storedBuffer, derivedKey)
}
