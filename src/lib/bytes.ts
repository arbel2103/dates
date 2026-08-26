/**
 * Byte plumbing shared by the codec.
 *
 * `Bytes` pins the buffer to a plain ArrayBuffer: TypeScript's `Uint8Array`
 * defaults to `ArrayBufferLike`, which WebCrypto and the streams API refuse,
 * and slices of a `Bytes` stay `Bytes` — so the whole pipeline type-checks
 * without casts.
 */
export type Bytes = Uint8Array<ArrayBuffer>

export const alloc = (length: number): Bytes => new Uint8Array(length)

/**
 * base64url — the URL-safe alphabet with no padding, so an encoded gift can sit
 * in a link without being mangled by chat apps that stop at '+' or '='.
 */
export function toBase64Url(bytes: Bytes): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Bytes {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  return fromBase64(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
}

/** Standard base64 with padding — what the GitHub blob API expects. */
export function toBase64(bytes: Bytes): string {
  let bin = ''
  // chunked so a multi-megabyte gift does not blow the argument limit
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

export function fromBase64(text: string): Bytes {
  const bin = atob(text)
  const out = alloc(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function concatBytes(...parts: Bytes[]): Bytes {
  const out = alloc(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}
