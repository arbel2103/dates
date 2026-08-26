import { describe, expect, it } from 'vitest'
import {
  MAX_INLINE_CHARS,
  decodeInline,
  encodeInline,
  openSealed,
  sealPayload,
  toPayload,
  type GiftPayload,
} from '../giftCodec'
import { fromBase64Url, toBase64Url } from '../bytes'
import { decodeText, encodeText, gunzip, gzip } from '../compress'
import type { Gift, Scene } from '../types'

const wheelScene: Scene = {
  type: 'wheel',
  title: 'גלגל הדייטים שלנו',
  subtitle: 'סובבי את הגלגל עם האצבע 👆',
  options: [
    { id: 'a', label: 'דייט ים', emoji: '🌊' },
    { id: 'b', label: 'סרט יחד', emoji: '🎬' },
    { id: 'c', label: 'יוצאים למסעדה', emoji: '🍝' },
    { id: 'd', label: 'ערב משחקי קופסה', emoji: '🎲' },
    { id: 'e', label: 'טיול ציפור', emoji: '🥾' },
  ],
  resultLead: 'הדייט הבא שלנו הוא',
  resultNote: 'תהיי מוכנה מחר ב-19:00,\nאני דואג להכל 😉',
}

const payload = (scenes: Scene[]): GiftPayload => ({ v: 1, scenes })

describe('compress', () => {
  it('survives a round trip through gzip, Hebrew and emoji included', async () => {
    const text = 'שלום אהבת חיי 💌\nהכנתי לך משהו'
    expect(decodeText(await gunzip(await gzip(encodeText(text))))).toBe(text)
  })
})

describe('base64url', () => {
  it('round-trips and stays safe for a URL', async () => {
    const bytes = crypto.getRandomValues(new Uint8Array(300))
    const encoded = toBase64Url(bytes)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]*$/)
    expect([...fromBase64Url(encoded)]).toEqual([...bytes])
  })
})

describe('inline gifts', () => {
  it('round-trips a whole gift', async () => {
    const decoded = await decodeInline(await encodeInline(payload([wheelScene])))
    expect(decoded).toEqual(payload([wheelScene]))
  })

  it('keeps a five-slice wheel small enough to live inside its own link', async () => {
    const encoded = await encodeInline(payload([wheelScene]))
    expect(encoded.length).toBeLessThan(MAX_INLINE_CHARS)
  })

  it('rejects something that is not a gift', async () => {
    const junk = toBase64Url(await gzip(encodeText('{"hello":true}')))
    await expect(decodeInline(junk)).rejects.toThrow()
  })
})

describe('sealed gifts', () => {
  it('opens with the right key', async () => {
    const { blob, key } = await sealPayload(payload([wheelScene]))
    expect(await openSealed(blob, key)).toEqual(payload([wheelScene]))
  })

  it('is useless without the key', async () => {
    const { blob } = await sealPayload(payload([wheelScene]))
    const wrong = toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
    await expect(openSealed(blob, wrong)).rejects.toThrow()
  })

  it('never puts the plaintext in the blob', async () => {
    const { blob } = await sealPayload(payload([wheelScene]))
    expect(decodeText(blob)).not.toContain('הדייט הבא')
  })

  it('produces a different blob every time, even for the same gift', async () => {
    const a = await sealPayload(payload([wheelScene]))
    const b = await sealPayload(payload([wheelScene]))
    expect(toBase64Url(a.blob)).not.toBe(toBase64Url(b.blob))
  })
})

describe('toPayload', () => {
  it('leaves the studio’s own bookkeeping at home', async () => {
    const gift: Gift = {
      id: 'local-id',
      title: 'שם פנימי שאסור שיישלח',
      recipient: 'אגמי',
      scenes: [wheelScene],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }
    const encoded = await encodeInline(toPayload(gift))
    const json = decodeText(await gunzip(fromBase64Url(encoded)))
    expect(json).not.toContain('שם פנימי')
    expect(json).not.toContain('local-id')
    expect(json).toContain('הדייט הבא')
  })
})
