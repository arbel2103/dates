import { uid } from '../lib/ids'
import type { Scene, SceneType, WheelOption } from '../lib/types'

/**
 * What a freshly added scene says.
 *
 * These are real sentences rather than placeholders: most of a gift never gets
 * edited, and a default that already reads well is the difference between
 * sending something tonight and abandoning a half-filled form.
 */
export function blankScene(type: SceneType, partner: string): Scene {
  const you = partner.trim()
  switch (type) {
    case 'envelope':
      return {
        type,
        note: you ? `ל${you}` : 'בשבילך',
        emoji: '💌',
        hint: 'מישהו השאיר לך פתק. פתחי אותו…',
      }
    case 'letter':
      return {
        type,
        text: 'שלום אהבת חיי,\nהכנתי לך משהו נחמד.\nאבל קודם — תסתדרי פה קצת…',
        speed: 38,
        cta: 'המשך',
      }
    case 'puzzle':
      return {
        type,
        title: 'תרכיבי אותנו מחדש',
        hint: 'גררי כל חלק למקום שלו',
        image: '',
        caption: you ? `אני ו${you}` : 'שנינו',
        rows: 3,
        cols: 3,
        doneText: 'אין עלייך',
        doneCta: 'גאה בך',
      }
    case 'gallery':
      return { type, photos: [], hint: 'לחצי על התמונה כדי להמשיך' }
    case 'wheel':
      return {
        type,
        title: 'גלגל הדייטים שלנו',
        subtitle: 'סובבי את הגלגל עם האצבע 👆',
        options: [],
        resultLead: 'הדייט הבא שלנו הוא',
        resultNote: 'תהיי מוכנה מחר ב-19:00,\nאני דואג להכל 😉',
      }
  }
}

export const SCENE_LABELS: Record<SceneType, string> = {
  envelope: 'פתק פתיחה',
  letter: 'מכתב',
  puzzle: 'פאזל',
  gallery: 'תמונות',
  wheel: 'גלגל',
}

export const SCENE_EMOJI: Record<SceneType, string> = {
  envelope: '💌',
  letter: '✍️',
  puzzle: '🧩',
  gallery: '📷',
  wheel: '🎡',
}

export const SCENE_ORDER: SceneType[] = [
  'envelope',
  'letter',
  'puzzle',
  'gallery',
  'wheel',
]

export const wheelOption = (label: string, emoji: string): WheelOption => ({
  id: uid(),
  label,
  emoji,
})
