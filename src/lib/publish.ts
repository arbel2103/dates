import { shortId } from './ids'
import {
  MAX_INLINE_CHARS,
  encodeInline,
  sealPayload,
  toPayload,
} from './giftCodec'
import { uploadGift, deleteGift } from './github/client'
import { getRepo, giftRepo, hasPat } from './github/pat'
import type { Gift, PublishedGift } from './types'

/**
 * Where a published gift is reachable. In the browser this is the running
 * origin; the constant is only a fallback for a preview served from somewhere
 * unexpected, so a copied link still points at the real site.
 */
const SITE_FALLBACK = 'https://arbel2103.github.io/dates/'

export function siteBase(): string {
  if (typeof window === 'undefined') return SITE_FALLBACK
  const { origin, pathname } = window.location
  // strip anything after the app's own base path
  const base = pathname.slice(0, pathname.indexOf('/', 1) + 1) || '/'
  return `${origin}${base}`
}

export class PublishError extends Error {}

/**
 * Turn a gift into a link.
 *
 * A gift with no pictures compresses small enough to live inside its own URL:
 * nothing is uploaded, nothing can expire, and it works with no token at all.
 * Once there are photos that stops being possible, so the gift is encrypted
 * and the ciphertext is committed to the repo — the key stays in the link's
 * fragment, which no server ever sees.
 */
export async function publishGift(gift: Gift): Promise<PublishedGift> {
  if (gift.scenes.length === 0) throw new PublishError('אין מה לפרסם — הוסף סצנה אחת לפחות')

  const payload = toPayload(gift)
  const inline = await encodeInline(payload)
  const base = siteBase()

  if (inline.length <= MAX_INLINE_CHARS) {
    return {
      id: gift.id,
      title: gift.title,
      url: `${base}#/v/${inline}`,
      mode: 'inline',
      publishedAt: new Date().toISOString(),
    }
  }

  if (!hasPat()) {
    throw new PublishError(
      'המתנה כוללת תמונות, ולכן צריך להעלות אותה. הוסף טוקן GitHub בהגדרות.',
    )
  }

  const id = shortId()
  const { blob, key } = await sealPayload(payload)
  const path = await uploadGift(id, blob)

  // the repo is left out when the gift sits where the site is served from,
  // which is the normal case and the shortest the link can be; naming it is
  // only needed when the two have been pointed apart in settings
  const where = getRepo() === giftRepo() ? '' : `${getRepo()}/`

  return {
    id: gift.id,
    title: gift.title,
    url: `${base}#/g/${where}${id}/${key}`,
    mode: 'hosted',
    publishedAt: new Date().toISOString(),
    path,
  }
}

/** Remove a hosted gift from the repo. Inline links cannot be revoked. */
export async function unpublishGift(published: PublishedGift): Promise<void> {
  if (published.mode === 'hosted' && published.path) await deleteGift(published.path)
}

/** A wa.me link that opens the chat with the gift already typed out. */
export function whatsappShare(url: string, phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const text = encodeURIComponent(`${message}\n${url}`)
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`
}
