/** A date idea in the personal library. */
export interface Idea {
  id: string
  title: string
  emoji: string
  /** free-text category, e.g. 'בחוץ' — chips on the ideas page are built from these */
  category: string
  notes?: string
  favorite?: boolean
  /** soft delete: drops off the list, keeps it recoverable */
  archivedAt?: string
  createdAt: string
}

/** One slice of the wheel. */
export interface WheelOption {
  id: string
  label: string
  emoji: string
}

/** A photo carried inside a gift: a data: URI plus its caption. */
export interface GiftPhoto {
  src: string
  caption?: string
}

export interface EnvelopeScene {
  type: 'envelope'
  /** what is written on the folded note itself, e.g. 'לאגמי 💌' */
  note: string
  emoji: string
  /** the line under the note, e.g. 'מישהו השאיר לך פתק. פתחי אותו…' */
  hint: string
}

export interface LetterScene {
  type: 'letter'
  text: string
  /** ms per character while the letter writes itself */
  speed: number
  /** the label on the button that appears once the letter finishes */
  cta: string
}

export interface PuzzleScene {
  type: 'puzzle'
  title: string
  hint: string
  /** data: URI of the picture, already resized by the studio */
  image: string
  /** the handwritten line in the polaroid's bottom band */
  caption: string
  rows: number
  cols: number
  /** the big handwritten line shown once the picture is whole */
  doneText: string
  doneCta: string
}

export interface GalleryScene {
  type: 'gallery'
  photos: GiftPhoto[]
  hint: string
}

export interface WheelScene {
  type: 'wheel'
  title: string
  subtitle: string
  options: WheelOption[]
  /** the line above the drawn result, e.g. 'הדייט הבא שלנו הוא' */
  resultLead: string
  /** the closing line under the result; empty hides it */
  resultNote: string
  /**
   * Which option must win, by id. Empty means an honest random draw — that is
   * the default; a fixed winner is there for when the date is already booked.
   */
  rigged?: string
}

/**
 * The reveal on its own: the same card the wheel lands on, without the wheel.
 * For when the date is already decided and the letter before it just has to
 * open onto it.
 */
export interface DateScene {
  type: 'date'
  /** the headline over the reveal, e.g. '🎉 מעולה!' */
  headline: string
  /** the line above the circled date */
  lead: string
  /** the date itself — what gets circled by hand */
  label: string
  /** the closing line underneath; empty hides it */
  note: string
}

export type Scene =
  | EnvelopeScene
  | LetterScene
  | PuzzleScene
  | GalleryScene
  | WheelScene
  | DateScene

export type SceneType = Scene['type']

/** Which background world a scene is rendered on. */
export type Skin = 'paper' | 'red'

/** A gift is just an ordered list of scenes — a wheel site is one of length 1. */
export interface Gift {
  id: string
  /** studio-side name, never shown to the recipient */
  title: string
  /** who it is for; used in default copy and in the share message */
  recipient: string
  scenes: Scene[]
  createdAt: string
  updatedAt: string
}

/** A gift that has been turned into a link. */
export interface PublishedGift {
  id: string
  title: string
  url: string
  /** 'inline' = the whole gift rides in the URL; 'hosted' = encrypted blob in the repo */
  mode: 'inline' | 'hosted'
  publishedAt: string
  /** hosted gifts only — the path in the gifts branch, so it can be removed later */
  path?: string
}
