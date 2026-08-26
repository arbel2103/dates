import { alloc, concatBytes, type Bytes } from './bytes'

/**
 * AES-GCM 256. The key never leaves the browser: it is generated here, travels
 * in the link's fragment (which no server ever receives) and is used again in
 * the recipient's browser. GitHub therefore stores bytes it cannot read.
 */
const IV_BYTES = 12

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
}

export async function exportKey(key: CryptoKey): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.exportKey('raw', key))
}

export async function importKey(raw: Bytes): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
}

/** Returns iv ‖ ciphertext, so the blob is self-describing. */
export async function encrypt(key: CryptoKey, plain: Bytes): Promise<Bytes> {
  const iv = crypto.getRandomValues(alloc(IV_BYTES))
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain),
  )
  return concatBytes(iv, cipher)
}

export async function decrypt(key: CryptoKey, blob: Bytes): Promise<Bytes> {
  if (blob.length <= IV_BYTES) throw new Error('blob too short to hold an IV')
  return new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: blob.subarray(0, IV_BYTES) },
      key,
      blob.subarray(IV_BYTES),
    ),
  )
}
