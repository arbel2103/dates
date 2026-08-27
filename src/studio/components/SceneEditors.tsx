import { useMemo, useRef, useState } from 'react'
import { Button, Field, Input, Textarea } from '../ui/Ui'
import { wheelOption } from '../sceneDefaults'
import { dataUrlBytes, shrinkImage, squareImage } from '../../lib/images'
import { categoriesOf, useIdeas } from '../../store/useIdeas'
import type {
  EnvelopeScene,
  GalleryScene,
  LetterScene,
  PuzzleScene,
  Scene,
  WheelScene,
} from '../../lib/types'

export interface EditorProps<T extends Scene> {
  scene: T
  onChange: (patch: Partial<T>) => void
}

/** Routes a scene to the form that knows how to edit it. */
export default function SceneEditor({
  scene,
  onChange,
}: {
  scene: Scene
  onChange: (patch: Partial<Scene>) => void
}) {
  switch (scene.type) {
    case 'envelope':
      return <EnvelopeEditor scene={scene} onChange={onChange as EditorProps<EnvelopeScene>['onChange']} />
    case 'letter':
      return <LetterEditor scene={scene} onChange={onChange as EditorProps<LetterScene>['onChange']} />
    case 'puzzle':
      return <PuzzleEditor scene={scene} onChange={onChange as EditorProps<PuzzleScene>['onChange']} />
    case 'gallery':
      return <GalleryEditor scene={scene} onChange={onChange as EditorProps<GalleryScene>['onChange']} />
    case 'wheel':
      return <WheelEditor scene={scene} onChange={onChange as EditorProps<WheelScene>['onChange']} />
  }
}

function EnvelopeEditor({ scene, onChange }: EditorProps<EnvelopeScene>) {
  return (
    <div className="grid gap-4">
      <Field label="מה כתוב על הפתק">
        <Input value={scene.note} onChange={(e) => onChange({ note: e.target.value })} />
      </Field>
      <Field label="אימוג׳י">
        <Input value={scene.emoji} onChange={(e) => onChange({ emoji: e.target.value })} />
      </Field>
      <Field label="השורה מתחת">
        <Input value={scene.hint} onChange={(e) => onChange({ hint: e.target.value })} />
      </Field>
    </div>
  )
}

function LetterEditor({ scene, onChange }: EditorProps<LetterScene>) {
  const seconds = Math.round((scene.text.length * scene.speed) / 1000)
  return (
    <div className="grid gap-4">
      <Field label="המכתב" hint={`ייכתב מול העיניים שלה בערך ${seconds} שניות`}>
        <Textarea rows={8} value={scene.text} onChange={(e) => onChange({ text: e.target.value })} />
      </Field>
      <Field label="קצב הכתיבה" hint={`${scene.speed} מילישניות לאות — נמוך יותר, מהיר יותר`}>
        <input
          type="range"
          min={12}
          max={90}
          value={scene.speed}
          onChange={(e) => onChange({ speed: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </Field>
      <Field label="כפתור ההמשך">
        <Input value={scene.cta} onChange={(e) => onChange({ cta: e.target.value })} />
      </Field>
    </div>
  )
}

function PuzzleEditor({ scene, onChange }: EditorProps<PuzzleScene>) {
  return (
    <div className="grid gap-4">
      <Field label="כותרת">
        <Input value={scene.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>
      <Field label="ההוראה">
        <Input value={scene.hint} onChange={(e) => onChange({ hint: e.target.value })} />
      </Field>

      <PhotoField
        label="התמונה"
        hint="נחתכת לריבוע — כך החלקים יוצאים שווים"
        value={scene.image}
        square
        onChange={(image) => onChange({ image })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="שורות">
          <Input
            type="number"
            min={2}
            max={5}
            value={scene.rows}
            onChange={(e) => onChange({ rows: clampGrid(e.target.value) })}
          />
        </Field>
        <Field label="עמודות">
          <Input
            type="number"
            min={2}
            max={5}
            value={scene.cols}
            onChange={(e) => onChange({ cols: clampGrid(e.target.value) })}
          />
        </Field>
      </div>
      <p className="text-xs text-muted -mt-2">
        {scene.rows * scene.cols} חלקים. יותר מ־16 מתחיל להיות עבודה במקום הפתעה.
      </p>

      <Field label="הכיתוב על הפולרויד">
        <Input value={scene.caption} onChange={(e) => onChange({ caption: e.target.value })} />
      </Field>
      <Field label="מה כתוב כשהיא מסיימת">
        <Input value={scene.doneText} onChange={(e) => onChange({ doneText: e.target.value })} />
      </Field>
      <Field label="כפתור ההמשך">
        <Input value={scene.doneCta} onChange={(e) => onChange({ doneCta: e.target.value })} />
      </Field>
    </div>
  )
}

const clampGrid = (value: string) => Math.min(5, Math.max(2, Number(value) || 3))

function GalleryEditor({ scene, onChange }: EditorProps<GalleryScene>) {
  const add = (src: string) =>
    onChange({ photos: [...scene.photos, { src, caption: '' }] })

  return (
    <div className="grid gap-4">
      <Field label="ההוראה">
        <Input value={scene.hint} onChange={(e) => onChange({ hint: e.target.value })} />
      </Field>

      {scene.photos.map((photo, i) => (
        <div key={i} className="flex gap-3 items-start">
          <img
            src={photo.src}
            alt=""
            className="w-16 h-16 rounded-xl object-cover border border-line shrink-0"
          />
          <div className="flex-1 min-w-0">
            <Input
              value={photo.caption ?? ''}
              placeholder="כיתוב בכתב יד…"
              onChange={(e) =>
                onChange({
                  photos: scene.photos.map((p, j) =>
                    j === i ? { ...p, caption: e.target.value } : p,
                  ),
                })
              }
            />
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onChange({ photos: scene.photos.filter((_, j) => j !== i) })}
          >
            ✕
          </Button>
        </div>
      ))}

      <PhotoField label="הוסף תמונה" value="" onChange={add} />
    </div>
  )
}

function WheelEditor({ scene, onChange }: EditorProps<WheelScene>) {
  const ideas = useIdeas((s) => s.ideas)
  const categories = useMemo(() => categoriesOf(ideas), [ideas])
  const [picking, setPicking] = useState(false)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})
  const flipCat = (cat: string) => setOpenCats((o) => ({ ...o, [cat]: !o[cat] }))

  const addIdea = (idea: { id: string; title: string; emoji: string }) =>
    onChange({ options: [...scene.options, { id: idea.id, label: idea.title, emoji: idea.emoji }] })

  return (
    <div className="grid gap-4">
      <Field label="כותרת">
        <Input value={scene.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>
      <Field label="תת־כותרת">
        <Input value={scene.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} />
      </Field>

      <Field label={`חלקי הגלגל (${scene.options.length})`}>
        <div className="grid gap-1.5">
          {scene.options.map((option, i) => (
            <div key={option.id} className="flex gap-2">
              <Input
                value={option.label}
                onChange={(e) =>
                  onChange({
                    options: scene.options.map((o, j) =>
                      j === i ? { ...o, label: e.target.value } : o,
                    ),
                  })
                }
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => onChange({ options: scene.options.filter((_, j) => j !== i) })}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange({ options: [...scene.options, wheelOption('', '💡')] })}
        >
          + חלק ריק
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPicking((p) => !p)}>
          {picking ? 'סגור' : 'מהרעיונות'}
        </Button>
      </div>

      {picking && (
        <div className="max-h-64 overflow-y-auto grid gap-1 border border-line rounded-xl p-2">
          {categories.map((cat) => {
            const items = ideas.filter((i) => i.category === cat)
            const expanded = openCats[cat] ?? false
            return (
              <div key={cat}>
                <button
                  onClick={() => flipCat(cat)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-start hover:bg-ink/5 rounded-lg transition"
                >
                  <span className={`text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                  <span className="flex-1 font-semibold text-sm">{cat}</span>
                  <span className="text-[11px] text-muted">{items.length}</span>
                </button>
                {expanded && items.map((idea) => (
                  <button
                    key={idea.id}
                    className="w-full text-start text-sm px-6 py-1.5 rounded-lg hover:bg-bg"
                    onClick={() => addIdea(idea)}
                  >
                    {idea.title}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <Field label="השורה שמעל התוצאה">
        <Input value={scene.resultLead} onChange={(e) => onChange({ resultLead: e.target.value })} />
      </Field>
      <Field label="שורת סיום">
        <Textarea
          rows={2}
          value={scene.resultNote}
          onChange={(e) => onChange({ resultNote: e.target.value })}
        />
      </Field>

      <Field label="תוצאה קבועה" hint="השאר על ״הגרלה אמיתית״ אלא אם הדייט כבר סגור">
        <select
          className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm"
          value={scene.rigged ?? ''}
          onChange={(e) => onChange({ rigged: e.target.value || undefined })}
        >
          <option value="">הגרלה אמיתית</option>
          {scene.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

/** Picking a picture, resized in the browser before it goes anywhere. */
function PhotoField({
  label,
  hint,
  value,
  square = false,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  square?: boolean
  onChange: (dataUrl: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      onChange(square ? await squareImage(file) : await shrinkImage(file))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={value}
            alt=""
            className="w-20 h-20 rounded-xl object-cover border border-line shrink-0"
          />
        )}
        <div className="flex-1">
          <Button variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? 'מעבד…' : value ? 'החלף תמונה' : 'בחר תמונה'}
          </Button>
          {value && (
            <p className="text-xs text-muted mt-1">
              {Math.round(dataUrlBytes(value) / 1024)} KB
            </p>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </Field>
  )
}
