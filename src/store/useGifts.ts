import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid } from '../lib/ids'
import type { Gift, PublishedGift, Scene } from '../lib/types'

interface State {
  gifts: Gift[]
  published: PublishedGift[]
  /** which draft the journey builder currently has open */
  editingId: string | null

  byId: (id: string) => Gift | undefined
  createGift: (title: string, recipient: string, scenes?: Scene[]) => string
  renameGift: (id: string, title: string) => void
  removeGift: (id: string) => void
  duplicateGift: (id: string) => string | undefined
  setEditing: (id: string | null) => void

  setScenes: (id: string, scenes: Scene[]) => void
  addScene: (id: string, scene: Scene) => void
  updateScene: (id: string, index: number, patch: Partial<Scene>) => void
  removeScene: (id: string, index: number) => void
  moveScene: (id: string, index: number, direction: -1 | 1) => void

  recordPublish: (record: PublishedGift) => void
  forgetPublish: (url: string) => void
}

const touch = (gift: Gift): Gift => ({ ...gift, updatedAt: new Date().toISOString() })

export const useGifts = create<State>()(
  persist(
    (set, get) => ({
      gifts: [],
      published: [],
      editingId: null,

      byId: (id) => get().gifts.find((g) => g.id === id),

      createGift: (title, recipient, scenes = []) => {
        const id = uid()
        const now = new Date().toISOString()
        set((s) => ({
          gifts: [{ id, title, recipient, scenes, createdAt: now, updatedAt: now }, ...s.gifts],
          editingId: id,
        }))
        return id
      },

      renameGift: (id, title) =>
        set((s) => ({ gifts: s.gifts.map((g) => (g.id === id ? touch({ ...g, title }) : g)) })),

      removeGift: (id) =>
        set((s) => ({
          gifts: s.gifts.filter((g) => g.id !== id),
          editingId: s.editingId === id ? null : s.editingId,
        })),

      duplicateGift: (id) => {
        const source = get().gifts.find((g) => g.id === id)
        if (!source) return undefined
        const copy = uid()
        const now = new Date().toISOString()
        set((s) => ({
          gifts: [
            { ...source, id: copy, title: `${source.title} — עותק`, createdAt: now, updatedAt: now },
            ...s.gifts,
          ],
          editingId: copy,
        }))
        return copy
      },

      setEditing: (editingId) => set({ editingId }),

      setScenes: (id, scenes) =>
        set((s) => ({ gifts: s.gifts.map((g) => (g.id === id ? touch({ ...g, scenes }) : g)) })),

      addScene: (id, scene) =>
        set((s) => ({
          gifts: s.gifts.map((g) =>
            g.id === id ? touch({ ...g, scenes: [...g.scenes, scene] }) : g,
          ),
        })),

      // the patch is always for the scene at `index`, whose type never changes,
      // so the cast keeps callers from having to re-assert the union member
      updateScene: (id, index, patch) =>
        set((s) => ({
          gifts: s.gifts.map((g) =>
            g.id === id
              ? touch({
                  ...g,
                  scenes: g.scenes.map((sc, i) =>
                    i === index ? ({ ...sc, ...patch } as Scene) : sc,
                  ),
                })
              : g,
          ),
        })),

      removeScene: (id, index) =>
        set((s) => ({
          gifts: s.gifts.map((g) =>
            g.id === id ? touch({ ...g, scenes: g.scenes.filter((_, i) => i !== index) }) : g,
          ),
        })),

      moveScene: (id, index, direction) =>
        set((s) => ({
          gifts: s.gifts.map((g) => {
            if (g.id !== id) return g
            const to = index + direction
            if (to < 0 || to >= g.scenes.length) return g
            const scenes = [...g.scenes]
            ;[scenes[index], scenes[to]] = [scenes[to], scenes[index]]
            return touch({ ...g, scenes })
          }),
        })),

      recordPublish: (record) =>
        set((s) => ({ published: [record, ...s.published.filter((p) => p.url !== record.url)] })),

      forgetPublish: (url) =>
        set((s) => ({ published: s.published.filter((p) => p.url !== url) })),
    }),
    { name: 'dates-gifts' },
  ),
)
