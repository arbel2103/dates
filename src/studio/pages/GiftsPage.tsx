import { useState } from 'react'
import { Button, Card, Empty, PageHeader } from '../ui/Ui'
import { unpublishGift, whatsappShare } from '../../lib/publish'
import { useGifts } from '../../store/useGifts'
import { useSettings } from '../../store/useSettings'
import type { PublishedGift } from '../../lib/types'

/** Everything that has been sent, and the links to send again. */
export default function GiftsPage() {
  const published = useGifts((s) => s.published)
  const forgetPublish = useGifts((s) => s.forgetPublish)
  const whatsapp = useSettings((s) => s.whatsapp)
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(url)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const takeDown = async (record: PublishedGift) => {
    setBusy(record.url)
    try {
      await unpublishGift(record)
      forgetPublish(record.url)
    } catch {
      // the link is already gone from the list either way; leaving a dead entry
      // behind would be worse than a blob that outlives it
      forgetPublish(record.url)
    } finally {
      setBusy(null)
    }
  }

  if (published.length === 0) {
    return (
      <div>
        <PageHeader title="האתרים שלי" />
        <Empty>עוד לא פרסמת כלום. תבנה גלגל או מסע, ותלחץ ״הפוך לאתר״.</Empty>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="האתרים שלי" subtitle={`${published.length} קישורים חיים`} />
      <ul className="grid gap-2">
        {published.map((record) => (
          <li key={record.url}>
            <Card className="grid gap-3">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold flex-1 min-w-0 truncate">{record.title}</span>
                <span className="text-xs text-muted shrink-0">
                  {record.mode === 'inline' ? 'בתוך הקישור' : 'מוצפן בשרת'}
                </span>
              </div>

              <code dir="ltr" className="block text-[11px] text-muted break-all line-clamp-2">
                {record.url}
              </code>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => copy(record.url)}>
                  {copied === record.url ? 'הועתק ✓' : 'העתק'}
                </Button>
                <a
                  href={whatsappShare(record.url, whatsapp, 'יש לך משהו 💌')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm px-3 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: '#1DC551' }}
                >
                  וואטסאפ
                </a>
                <a
                  href={record.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm px-3 py-1.5 rounded-lg border border-line"
                >
                  פתח
                </a>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy === record.url}
                  onClick={() => takeDown(record)}
                >
                  {busy === record.url ? '…' : record.mode === 'hosted' ? 'הורד מהאוויר' : 'הסר מהרשימה'}
                </Button>
              </div>

              {record.mode === 'inline' && (
                <p className="text-xs text-muted">
                  קישור כזה נושא את התוכן בעצמו — אי אפשר לבטל אותו, רק להפסיק לשתף.
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
