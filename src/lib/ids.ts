/** A short, unguessable id. 12 base32 chars ≈ 60 bits of entropy. */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

export function shortId(length = 12): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return out
}

/** A uuid for local records, where guessability does not matter. */
export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
