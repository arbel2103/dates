import { useMemo, useState } from 'react'
import { Button, Empty, Field, Input, Modal, PageHeader, Textarea } from '../ui/Ui'
import { categoriesOf, useIdeas } from '../../store/useIdeas'
import { SEED_CATEGORIES } from '../../seed/ideas'
import type { Idea } from '../../lib/types'

/** The library. Everything the wheel draws from starts here. */
export default function IdeasPage() {
  const ideas = useIdeas((s) => s.ideas)
  const removeIdea = useIdeas((s) => s.removeIdea)
  const toggleFavorite = useIdeas((s) => s.toggleFavorite)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [editing, setEditing] = useState<Idea | 'new' | null>(null)

  const categories = useMemo(() => categoriesOf(ideas), [ideas])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ideas.filter((idea) => {
      if (category && idea.category !== category) return false
      if (!q) return true
      return (
        idea.title.toLowerCase().includes(q) || (idea.notes ?? '').toLowerCase().includes(q)
      )
    })
  }, [ideas, query, category])

  return (
    <div>
      <PageHeader
        title="רעיונות"
        subtitle={`${ideas.length} רעיונות בארון. מכאן בונים את הגלגל.`}
      />

      <div className="flex gap-2 mb-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש…"
          aria-label="חיפוש רעיונות"
        />
        <Button onClick={() => setEditing('new')} className="shrink-0">
          + רעיון
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1">
        <Chip active={category === null} onClick={() => setCategory(null)}>
          הכל
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty>אין רעיונות שמתאימים. נסה חיפוש אחר, או הוסף רעיון חדש.</Empty>
      ) : (
        <ul className="grid gap-px">
          {shown.map((idea) => (
            <li key={idea.id}>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border-b border-line">
                <button
                  className="flex-1 min-w-0 text-start truncate text-[13px] font-medium"
                  onClick={() => setEditing(idea)}
                >
                  {idea.title}
                </button>
                <span className="text-[10px] text-muted shrink-0">{idea.category}</span>
                <button
                  onClick={() => toggleFavorite(idea.id)}
                  className="shrink-0 w-6 h-6 grid place-items-center rounded text-xs hover:bg-ink/5 transition"
                  aria-label={idea.favorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                >
                  {idea.favorite ? '★' : '☆'}
                </button>
                <button
                  onClick={() => removeIdea(idea.id)}
                  className="shrink-0 w-6 h-6 grid place-items-center rounded text-xs text-muted hover:text-red-600 transition"
                  aria-label={`מחק ${idea.title}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <IdeaEditor idea={editing} onClose={() => setEditing(null)} categories={categories} />
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${
        active ? 'bg-ink text-bg' : 'bg-surface border border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function IdeaEditor({
  idea,
  categories,
  onClose,
}: {
  idea: Idea | 'new' | null
  categories: string[]
  onClose: () => void
}) {
  const addIdea = useIdeas((s) => s.addIdea)
  const updateIdea = useIdeas((s) => s.updateIdea)
  const existing = idea && idea !== 'new' ? idea : null

  // remounting on every open is what resets the fields — a stale draft from the
  // last idea appearing in the next one is worse than any amount of state code
  const key = existing?.id ?? (idea === 'new' ? 'new' : 'closed')

  return (
    <Modal open={idea !== null} onClose={onClose} title={existing ? 'עריכת רעיון' : 'רעיון חדש'}>
      <EditorBody
        key={key}
        existing={existing}
        categories={categories}
        onSubmit={(draft) => {
          if (existing) updateIdea(existing.id, draft)
          else addIdea(draft)
          onClose()
        }}
      />
    </Modal>
  )
}

function EditorBody({
  existing,
  categories,
  onSubmit,
}: {
  existing: Idea | null
  categories: string[]
  onSubmit: (draft: Pick<Idea, 'title' | 'category' | 'notes'>) => void
}) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState(existing?.category ?? 'כללי')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const options = [...new Set([...categories, ...SEED_CATEGORIES, 'כללי'])]

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSubmit({ title, category, notes: notes.trim() || undefined })
      }}
    >
      <Field label="הרעיון">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="דייט ים בשקיעה" />
      </Field>

      <Field label="קטגוריה">
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="idea-categories"
        />
        <datalist id="idea-categories">
          {options.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field label="הערות" hint="לא מופיע באתר שנשלח — רק כאן">
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Button type="submit" size="lg" disabled={!title.trim()}>
        {existing ? 'שמור' : 'הוסף'}
      </Button>
    </form>
  )
}
