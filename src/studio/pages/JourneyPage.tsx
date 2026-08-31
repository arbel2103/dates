import { useState } from 'react'
import PublishSheet from '../components/PublishSheet'
import SceneEditor from '../components/SceneEditors'
import { Button, Card, Empty, Field, Input, Modal, PageHeader } from '../ui/Ui'
import { SCENE_EMOJI, SCENE_LABELS, SCENE_ORDER, blankScene } from '../sceneDefaults'
import { useGifts } from '../../store/useGifts'
import { useSettings } from '../../store/useSettings'
import type { Scene } from '../../lib/types'

/**
 * The builder. A gift is an ordered list of scenes, so the page is a list you
 * add to, reorder, and open one at a time — the same shape as the thing being
 * made, which is what keeps it understandable as gifts grow.
 */
export default function JourneyPage() {
  const gifts = useGifts((s) => s.gifts)
  const editingId = useGifts((s) => s.editingId)
  const setEditing = useGifts((s) => s.setEditing)
  const createGift = useGifts((s) => s.createGift)
  const removeGift = useGifts((s) => s.removeGift)
  const addScene = useGifts((s) => s.addScene)
  const updateScene = useGifts((s) => s.updateScene)
  const removeScene = useGifts((s) => s.removeScene)
  const moveScene = useGifts((s) => s.moveScene)
  const renameGift = useGifts((s) => s.renameGift)
  const partner = useSettings((s) => s.partner)

  const [openScene, setOpenScene] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const gift = gifts.find((g) => g.id === editingId)

  if (!gift) {
    return (
      <div>
        <PageHeader title="מסע" subtitle="מעטפה, מכתב, פאזל, תמונות, גלגל, דייט — ברצף אחד." />
        {gifts.length > 0 && (
          <ul className="grid gap-2 mb-4">
            {gifts.map((g) => (
              <li key={g.id}>
                <Card className="flex items-center gap-3">
                  <button className="flex-1 text-start min-w-0" onClick={() => setEditing(g.id)}>
                    <span className="block font-semibold truncate">{g.title}</span>
                    <span className="block text-xs text-muted">{g.scenes.length} סצנות</span>
                  </button>
                  <Button variant="danger" size="sm" onClick={() => removeGift(g.id)}>
                    ✕
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
        <Button size="lg" className="w-full" onClick={() => createGift('מסע חדש', partner)}>
          + מסע חדש
        </Button>
        {gifts.length === 0 && (
          <div className="mt-4">
            <Empty>עוד לא בנית כלום. התחל ממסע חדש והוסף לו סצנות.</Empty>
          </div>
        )}
      </div>
    )
  }

  const scene = openScene !== null ? gift.scenes[openScene] : undefined

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
          → כל המסעות
        </Button>
      </div>

      <Field label="שם המסע" hint="רק בשבילך — לא מופיע באתר">
        <Input value={gift.title} onChange={(e) => renameGift(gift.id, e.target.value)} />
      </Field>

      <h2 className="font-semibold text-sm mt-6 mb-2">הסצנות, לפי הסדר</h2>

      {gift.scenes.length === 0 ? (
        <Empty>מסע ריק. הוסף סצנה ראשונה — פתק פתיחה זו התחלה טובה.</Empty>
      ) : (
        <ul className="grid gap-2">
          {gift.scenes.map((s, i) => (
            <li key={i}>
              <Card className="flex items-center gap-2">
                <span className="text-xl shrink-0" aria-hidden>
                  {SCENE_EMOJI[s.type]}
                </span>
                <button className="flex-1 text-start min-w-0" onClick={() => setOpenScene(i)}>
                  <span className="block font-semibold text-sm">{SCENE_LABELS[s.type]}</span>
                  <span className="block text-xs text-muted truncate">{summarise(s)}</span>
                </button>
                <button
                  className="w-8 h-8 grid place-items-center rounded-lg hover:bg-ink/5 disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => moveScene(gift.id, i, -1)}
                  aria-label="הזז למעלה"
                >
                  ↑
                </button>
                <button
                  className="w-8 h-8 grid place-items-center rounded-lg hover:bg-ink/5 disabled:opacity-30"
                  disabled={i === gift.scenes.length - 1}
                  onClick={() => moveScene(gift.id, i, 1)}
                  aria-label="הזז למטה"
                >
                  ↓
                </button>
                <button
                  className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeScene(gift.id, i)}
                  aria-label="מחק סצנה"
                >
                  ✕
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" className="w-full mt-3" onClick={() => setAdding(true)}>
        + סצנה
      </Button>

      <div className="grid grid-cols-2 gap-2 mt-6 pb-2">
        <Button
          variant="outline"
          size="lg"
          disabled={gift.scenes.length === 0}
          onClick={() =>
            window.open(`${window.location.pathname}#/preview?gift=${gift.id}`, '_blank')
          }
        >
          תצוגה מקדימה
        </Button>
        <Button size="lg" disabled={gift.scenes.length === 0} onClick={() => setPublishing(true)}>
          הפוך לאתר
        </Button>
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="איזו סצנה להוסיף?"
      >
        <div className="grid grid-cols-2 gap-2">
          {SCENE_ORDER.map((type) => (
            <button
              key={type}
              className="flex flex-col items-center gap-1 p-4 rounded-2xl border border-line hover:bg-bg transition"
              onClick={() => {
                addScene(gift.id, blankScene(type))
                setAdding(false)
                setOpenScene(gift.scenes.length)
              }}
            >
              <span className="text-2xl" aria-hidden>
                {SCENE_EMOJI[type]}
              </span>
              <span className="text-sm font-semibold">{SCENE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={scene !== undefined}
        onClose={() => setOpenScene(null)}
        title={scene ? SCENE_LABELS[scene.type] : ''}
        footer={
          <Button className="w-full" onClick={() => setOpenScene(null)}>
            סגור
          </Button>
        }
      >
        {scene && openScene !== null && (
          <SceneEditor
            scene={scene}
            onChange={(patch) => updateScene(gift.id, openScene, patch)}
          />
        )}
      </Modal>

      <PublishSheet gift={gift} open={publishing} onClose={() => setPublishing(false)} />
    </div>
  )
}

/**
 * One line describing a scene, so the list is readable without opening each.
 * Scenes now start empty, so each says so plainly rather than showing a blank.
 */
function summarise(scene: Scene): string {
  switch (scene.type) {
    case 'envelope':
      return scene.note || 'עוד לא נכתב'
    case 'letter':
      return scene.text.split('\n')[0] || 'עוד לא נכתב'
    case 'puzzle':
      return `${scene.rows}×${scene.cols}${scene.image ? '' : ' — עוד אין תמונה'}`
    case 'gallery':
      return scene.photos.length ? `${scene.photos.length} תמונות` : 'עוד אין תמונות'
    case 'wheel':
      return scene.options.length ? `${scene.options.length} חלקים` : 'עוד אין חלקים'
    case 'date':
      return scene.label || 'עוד לא נבחר דייט'
  }
}
