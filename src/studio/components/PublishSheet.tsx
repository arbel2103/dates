import { useEffect, useState } from 'react'
import { Button, Modal } from '../ui/Ui'
import { PublishError, publishGift, whatsappShare } from '../../lib/publish'
import { useGifts } from '../../store/useGifts'
import { useSettings } from '../../store/useSettings'
import type { Gift, PublishedGift } from '../../lib/types'

type State =
  | { step: 'working' }
  | { step: 'done'; published: PublishedGift }
  | { step: 'failed'; message: string }

/**
 * Turning a gift into a link. This is the moment the whole app exists for, so
 * it says plainly which of the two routes was taken and hands over something
 * that can be pasted into a chat in one tap.
 */
export default function PublishSheet({
  gift,
  open,
  onClose,
}: {
  gift: Gift | undefined
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="הפוך לאתר">
      {/* mounted only while open, and keyed by the gift, so each publish starts
          from a clean slate instead of having its state reset in an effect */}
      {open && gift && <Publishing key={gift.id} gift={gift} onClose={onClose} />}
    </Modal>
  )
}

function Publishing({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const recordPublish = useGifts((s) => s.recordPublish)
  const whatsapp = useSettings((s) => s.whatsapp)
  const [state, setState] = useState<State>({ step: 'working' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    publishGift(gift)
      .then((published) => {
        if (!alive) return
        recordPublish(published)
        setState({ step: 'done', published })
      })
      .catch((err: unknown) => {
        if (!alive) return
        setState({
          step: 'failed',
          message:
            err instanceof PublishError || err instanceof Error
              ? err.message
              : 'הפרסום נכשל',
        })
      })
    return () => {
      alive = false
    }
  }, [gift, recordPublish])

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      {state.step === 'working' && (
        <p className="text-sm text-muted py-6 text-center">מכין את הקישור…</p>
      )}

      {state.step === 'failed' && (
        <div className="grid gap-3">
          <p className="text-sm text-red-600">{state.message}</p>
          <Button variant="outline" onClick={onClose}>
            סגור
          </Button>
        </div>
      )}

      {state.step === 'done' && (
        <div className="grid gap-4">
          <p className="text-sm text-muted">
            {state.published.mode === 'inline'
              ? 'המתנה נכנסה כולה לתוך הקישור — אין שום קובץ בשרת, והוא יעבוד לתמיד.'
              : 'המתנה הוצפנה והועלתה. רק מי שיש לו את הקישור המלא יכול לפתוח אותה.'}
          </p>

          <code
            dir="ltr"
            className="block text-xs bg-bg border border-line rounded-xl p-3 break-all max-h-28 overflow-y-auto"
          >
            {state.published.url}
          </code>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => copy(state.published.url)}>
              {copied ? 'הועתק ✓' : 'העתק קישור'}
            </Button>
            <a
              href={whatsappShare(
                state.published.url,
                whatsapp,
                gift.recipient ? `${gift.recipient}, יש לך משהו 💌` : 'יש לך משהו 💌',
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center font-medium text-sm px-4 py-2 rounded-xl text-white"
              style={{ background: '#1DC551' }}
            >
              שלח בוואטסאפ
            </a>
          </div>

          <a
            href={state.published.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent text-center underline underline-offset-4"
          >
            פתח כדי לבדוק
          </a>
        </div>
      )}
    </>
  )
}
