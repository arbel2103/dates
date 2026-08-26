import { fromBase64Url, toBase64Url, type Bytes } from './bytes'
import { decodeText, encodeText, gunzip, gzip } from './compress'
import { decrypt, encrypt, exportKey, generateKey, importKey } from './crypto'
import type { Gift, Scene } from './types'

/**
 * What actually travels: the gift stripped of everything the recipient's
 * browser does not need. The studio's own bookkeeping (titles, timestamps)
 * stays home — it is both noise in the payload and none of the recipient's
 * business.
 */
export interface GiftPayload {
  v: 1
  scenes: Scene[]
}

/**
 * Links longer than this stop being pleasant to send: chat previews truncate
 * them and they look alarming in a message. Above it we host the gift instead.
 */
export const MAX_INLINE_CHARS = 2400

export const toPayload = (gift: Gift): GiftPayload => ({ v: 1, scenes: gift.scenes })

function assertPayload(value: unknown): GiftPayload {
  const p = value as Partial<GiftPayload>
  if (!p || p.v !== 1 || !Array.isArray(p.scenes)) throw new Error('לא מכתב תקין')
  return p as GiftPayload
}

/** gzip(JSON) — the shared first step of both publishing paths. */
async function packPayload(payload: GiftPayload): Promise<Bytes> {
  return gzip(encodeText(JSON.stringify(payload)))
}

async function unpackPayload(packed: Bytes): Promise<GiftPayload> {
  return assertPayload(JSON.parse(decodeText(await gunzip(packed))))
}

/* ---------- inline: the gift rides inside its own link ---------- */

export async function encodeInline(payload: GiftPayload): Promise<string> {
  return toBase64Url(await packPayload(payload))
}

export async function decodeInline(data: string): Promise<GiftPayload> {
  return unpackPayload(fromBase64Url(data))
}

/* ---------- hosted: an encrypted blob, with the key kept out of it ---------- */

export interface SealedGift {
  /** the bytes to upload — meaningless without the key */
  blob: Bytes
  /** base64url of the raw AES key; belongs in the link fragment only */
  key: string
}

export async function sealPayload(payload: GiftPayload): Promise<SealedGift> {
  const key = await generateKey()
  const blob = await encrypt(key, await packPayload(payload))
  return { blob, key: toBase64Url(await exportKey(key)) }
}

export async function openSealed(blob: Bytes, keyText: string): Promise<GiftPayload> {
  const key = await importKey(fromBase64Url(keyText))
  return unpackPayload(await decrypt(key, blob))
}
