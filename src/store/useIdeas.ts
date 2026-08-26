import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/ids'
import { seedIdeas } from '../seed/ideas'
import type { Idea } from '../lib/types'

interface State {
  ideas: Idea[]
  addIdea: (idea: Pick<Idea, 'title' | 'category'> & Partial<Idea>) => string
  updateIdea: (id: string, patch: Partial<Omit<Idea, 'id'>>) => void
  removeIdea: (id: string) => void
  toggleFavorite: (id: string) => void
  /** put the seeded ideas back without touching anything written since */
  restoreSeeds: () => void
}

export const useIdeas = create<State>()(
  persist(
    (set) => ({
      ideas: seedIdeas(),

      addIdea: (idea) => {
        const id = uid()
        set((s) => ({
          ideas: [
            {
              ...idea,
              id,
              title: idea.title.trim(),
              emoji: idea.emoji || '💡',
              category: idea.category || 'כללי',
              createdAt: new Date().toISOString(),
            },
            ...s.ideas,
          ],
        }))
        return id
      },

      updateIdea: (id, patch) =>
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      // a deleted idea really goes: the library is meant to be pruned, and a
      // hidden pile of archived ideas is just clutter that never gets read
      removeIdea: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),

      toggleFavorite: (id) =>
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)),
        })),

      restoreSeeds: () =>
        set((s) => {
          const have = new Set(s.ideas.map((i) => i.id))
          return { ideas: [...s.ideas, ...seedIdeas().filter((i) => !have.has(i.id))] }
        }),
    }),
    { name: 'dates-ideas' },
  ),
)

/** Every category currently in use, in the order they first appear. */
export const categoriesOf = (ideas: Idea[]): string[] => [
  ...new Set(ideas.map((i) => i.category).filter(Boolean)),
]
