/**
 * Credential Encryption Utility
 * 
 * Uses AES-256-GCM for encrypting API tokens stored in the database.
 * The encryption key is derived from ENCRYPTION_KEY env variable.
 * 
 * SECURITY: In production, ENCRYPTION_KEY must be set to a cryptographically
 * random 32-byte hex string. Never commit this key to version control.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Resolve the encryption salt from the ENCRYPTION_SALT environment variable.
 * SECURITY: In production (NODE_ENV=production), ENCRYPTION_SALT MUST be set.
 * In development, falls back to a known value for convenience but logs a warning.
 */
function getEncryptionSalt(): string {
  const salt = process.env.ENCRYPTION_SALT
  if (salt) return salt

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[Encryption] FATAL: ENCRYPTION_SALT environment variable is not set. ' +
      'Refusing to use a fallback in production. Generate one with: openssl rand -hex 16'
    )
  }

  console.warn(
    '[Encryption] WARNING: ENCRYPTION_SALT is not set. Using development fallback. ' +
    'This is insecure — set ENCRYPTION_SALT before deploying.'
  )
  return 'ghoststudio-salt-dev-only'
}

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  const salt = getEncryptionSalt()

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[Encryption] FATAL: ENCRYPTION_KEY environment variable is not set. ' +
        'Refusing to use a fallback in production. Generate one with: openssl rand -hex 32'
      )
    }

    // In development, fall back to NEXTAUTH_SECRET
    const fallback = process.env.NEXTAUTH_SECRET
    if (!fallback) {
      throw new Error(
        '[Encryption] FATAL: Neither ENCRYPTION_KEY nor NEXTAUTH_SECRET is set. ' +
        'At least one must be configured. Generate ENCRYPTION_KEY with: openssl rand -hex 32'
      )
    }
    console.warn(
      '[Encryption] WARNING: ENCRYPTION_KEY is not set. Deriving from NEXTAUTH_SECRET as fallback. ' +
      'This is insecure — set ENCRYPTION_KEY before deploying.'
    )
    return scryptSync(fallback, salt, KEY_LENGTH)
  }
  // If the key is a hex string, use it directly
  if (secret.length === 64 && /^[0-9a-f]+$/i.test(secret)) {
    return Buffer.from(secret, 'hex')
  }
  // Otherwise derive a key from the secret
  return scryptSync(secret, salt, KEY_LENGTH)
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns a base64-encoded string containing IV + auth tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Combine IV + authTag + ciphertext into a single buffer
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'base64'),
  ])
  
  return combined.toString('base64')
}

/**
 * Decrypt an encrypted string back to plaintext
 * Expects a base64-encoded string containing IV + auth tag + ciphertext
 */
export function decrypt(encryptedBase64: string): string {
  if (!encryptedBase64) return ''
  
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedBase64, 'base64')
    
    // Extract IV, auth tag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH)
    
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(ciphertext, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    // If decryption fails (e.g., key changed), return empty string
    // This prevents crashes but the credential will need to be re-entered
    console.error('[Encryption] Decryption failed:', error instanceof Error ? error.message : 'Unknown error')
    return ''
  }
}

/**
 * Check if a string appears to be encrypted (base64 with IV + tag + data)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  try {
    const buf = Buffer.from(value, 'base64')
    // Encrypted values should be at least IV + auth tag + some ciphertext
    return buf.length > IV_LENGTH + TAG_LENGTH
  } catch {
    return false
  }
}
