import { useMemo, useState } from 'react'
import PublishSheet from '../components/PublishSheet'
import { Button, Card, Empty, Field, Input, PageHeader, Textarea } from '../ui/Ui'
import { blankScene } from '../sceneDefaults'
import { sliceColor } from '../../lib/wheel'
import { useGifts } from '../../store/useGifts'
import { categoriesOf, useIdeas } from '../../store/useIdeas'
import { useSettings } from '../../store/useSettings'
import type { Idea, WheelScene } from '../../lib/types'

const WHEEL_GIFT_TITLE = 'גלגל הדייטים'
const MAX_SLICES = 8

/**
 * Pick tonight's shortlist and send it as a wheel.
 *
 * The whole page is one draft that is rebuilt on every publish rather than a
 * saved document: a wheel is a throwaway thing, made for one evening.
 */
export default function WheelPage() {
  const ideas = useIdeas((s) => s.ideas)
  const partner = useSettings((s) => s.partner)
  const createGift = useGifts((s) => s.createGift)
  const removeGift = useGifts((s) => s.removeGift)
  const gifts = useGifts((s) => s.gifts)

  const [chosen, setChosen] = useState<string[]>([])
  const [copy, setCopy] = useState(() => {
    const base = blankScene('wheel') as WheelScene
    return { title: base.title, subtitle: base.subtitle, resultLead: base.resultLead, resultNote: base.resultNote }
  })
  const [publishId, setPublishId] = useState<string | null>(null)

  const selected = useMemo(
    () => chosen.map((id) => ideas.find((i) => i.id === id)).filter((i) => i !== undefined),
    [chosen, ideas],
  )

  const toggle = (id: string) =>
    setChosen((list) =>
      list.includes(id)
        ? list.filter((x) => x !== id)
        : list.length >= MAX_SLICES
          ? list
          : [...list, id],
    )

  const scene = (): WheelScene => ({
    ...(blankScene('wheel') as WheelScene),
    ...copy,
    options: selected.map((i) => ({ id: i.id, label: i.title, emoji: i.emoji })),
  })

  const preview = () => {
    const id = createGift(WHEEL_GIFT_TITLE, partner, [scene()])
    window.open(`${window.location.pathname}#/preview?gift=${id}`, '_blank')
    // the draft was only ever a vehicle for the preview window
    window.setTimeout(() => removeGift(id), 4000)
  }

  const publish = () => setPublishId(createGift(WHEEL_GIFT_TITLE, partner, [scene()]))

  const publishing = publishId ? gifts.find((g) => g.id === publishId) : undefined

  return (
    <div>
      <PageHeader
        title="גלגל"
        subtitle={`בחר עד ${MAX_SLICES} רעיונות, ושלח אותם כגלגל שהיא מסובבת.`}
      />

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">
            נבחרו {selected.length} / {MAX_SLICES}
          </span>
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setChosen([])}>
              נקה
            </Button>
          )}
        </div>

        {selected.length === 0 ? (
          <p className="text-sm text-muted">עדיין לא נבחר כלום.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {selected.map((idea, i) => (
              <li key={idea.id}>
                <button
                  onClick={() => toggle(idea.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold border border-line"
                  style={{ background: sliceColor(i) }}
                >
                  {idea.emoji} {idea.title} ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {ideas.length === 0 ? (
        <Empty>אין רעיונות עדיין. תוסיף כמה בעמוד הרעיונות.</Empty>
      ) : (
        <CategoryAccordion ideas={ideas} chosen={chosen} toggle={toggle} />
      )}

      <Card className="grid gap-4 mb-4">
        <Field label="כותרת">
          <Input value={copy.title} onChange={(e) => setCopy({ ...copy, title: e.target.value })} />
        </Field>
        <Field label="תת־כותרת">
          <Input
            value={copy.subtitle}
            onChange={(e) => setCopy({ ...copy, subtitle: e.target.value })}
          />
        </Field>
        <Field label="השורה שמעל התוצאה">
          <Input
            value={copy.resultLead}
            onChange={(e) => setCopy({ ...copy, resultLead: e.target.value })}
          />
        </Field>
        <Field label="שורת סיום" hint="מופיעה אחרי שהתוצאה מוקפת. אפשר להשאיר ריק.">
          <Textarea
            rows={2}
            value={copy.resultNote}
            onChange={(e) => setCopy({ ...copy, resultNote: e.target.value })}
          />
        </Field>
      </Card>

      <div className="grid grid-cols-2 gap-2 pb-2">
        <Button variant="outline" size="lg" disabled={selected.length < 2} onClick={preview}>
          תצוגה מקדימה
        </Button>
        <Button size="lg" disabled={selected.length < 2} onClick={publish}>
          הפוך לאתר
        </Button>
      </div>
      {selected.length < 2 && (
        <p className="text-xs text-muted text-center mt-2">צריך לפחות שני רעיונות כדי לסובב.</p>
      )}

      <PublishSheet
        gift={publishing}
        open={publishId !== null}
        onClose={() => {
          if (publishId) removeGift(publishId)
          setPublishId(null)
        }}
      />
    </div>
  )
}

function CategoryAccordion({
  ideas,
  chosen,
  toggle,
}: {
  ideas: Idea[]
  chosen: string[]
  toggle: (id: string) => void
}) {
  const categories = useMemo(() => categoriesOf(ideas), [ideas])
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const flip = (cat: string) => setOpen((o) => ({ ...o, [cat]: !o[cat] }))

  return (
    <div className="grid gap-1.5 mb-5">
      {categories.map((cat) => {
        const items = ideas.filter((i) => i.category === cat)
        const expanded = open[cat] ?? false
        const chosenCount = items.filter((i) => chosen.includes(i.id)).length
        return (
          <div key={cat} className="rounded-xl border border-line bg-surface overflow-hidden">
            <button
              onClick={() => flip(cat)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-start hover:bg-ink/5 transition"
            >
              <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
              <span className="flex-1 font-semibold text-sm">{cat}</span>
              {chosenCount > 0 && (
                <span className="text-[11px] text-accent font-bold">{chosenCount} נבחרו</span>
              )}
              <span className="text-[11px] text-muted">{items.length}</span>
            </button>
            {expanded && (
              <ul className="border-t border-line">
                {items.map((idea) => {
                  const active = chosen.includes(idea.id)
                  const full = !active && chosen.length >= MAX_SLICES
                  return (
                    <li key={idea.id}>
                      <button
                        onClick={() => toggle(idea.id)}
                        disabled={full}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-start transition disabled:opacity-40 ${
                          active ? 'bg-accent-soft' : 'hover:bg-bg'
                        }`}
                      >
                        <span className="text-base shrink-0" aria-hidden>
                          {idea.emoji}
                        </span>
                        <span className="flex-1 min-w-0 truncate text-sm">
                          {idea.title}
                        </span>
                        <span className="shrink-0 text-sm" aria-hidden>
                          {active ? '✓' : ''}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
