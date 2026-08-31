import { uid } from '../lib/ids'
import type { Scene, SceneType, WheelOption } from '../lib/types'

/**
 * What a freshly added scene starts as: nothing written.
 *
 * Every word in a gift is meant to be its author's, so a new scene arrives
 * empty and waits to be filled rather than arriving with sentences to delete
 * first. Only the numbers that have to mean something — the typing speed, the
 * puzzle grid — come with a working value.
 *
 * The scenes fall back to a readable label for their continue button when one
 * is left blank, so an empty scene is still a scene that can be walked through.
 */
export function blankScene(type: SceneType): Scene {
  switch (type) {
    case 'envelope':
      return { type, note: '', emoji: '', hint: '' }
    case 'letter':
      return { type, text: '', speed: 38, cta: '' }
    case 'puzzle':
      return {
        type,
        title: '',
        hint: '',
        image: '',
        caption: '',
        rows: 3,
        cols: 3,
        doneText: '',
        doneCta: '',
      }
    case 'gallery':
      return { type, photos: [], hint: '' }
    case 'wheel':
      return { type, title: '', subtitle: '', options: [], resultLead: '', resultNote: '' }
    case 'date':
      return { type, headline: '', lead: '', label: '', note: '' }
  }
}

export const SCENE_LABELS: Record<SceneType, string> = {
  envelope: 'פתק פתיחה',
  letter: 'מכתב',
  puzzle: 'פאזל',
  gallery: 'תמונות',
  wheel: 'גלגל',
  date: 'דייט',
}

export const SCENE_EMOJI: Record<SceneType, string> = {
  envelope: '💌',
  letter: '✍️',
  puzzle: '🧩',
  gallery: '📷',
  wheel: '🎡',
  date: '🎯',
}

export const SCENE_ORDER: SceneType[] = [
  'envelope',
  'letter',
  'puzzle',
  'gallery',
  'wheel',
  'date',
]

export const wheelOption = (label: string, emoji: string): WheelOption => ({
  id: uid(),
  label,
  emoji,
})
