import { beforeEach, describe, expect, it } from 'vitest'
import { useGifts } from '../useGifts'
import type { Scene } from '../../lib/types'

const letter = (text: string): Scene => ({ type: 'letter', text, speed: 38, cta: 'המשך' })

const store = () => useGifts.getState()

beforeEach(() => {
  useGifts.setState({ gifts: [], published: [], editingId: null })
})

describe('gifts', () => {
  it('creates a gift and opens it for editing', () => {
    const id = store().createGift('מסע', 'אגמי')
    expect(store().byId(id)?.title).toBe('מסע')
    expect(store().editingId).toBe(id)
  })

  it('adds, reorders and removes scenes', () => {
    const id = store().createGift('מסע', 'אגמי')
    store().addScene(id, letter('ראשון'))
    store().addScene(id, letter('שני'))

    store().moveScene(id, 0, 1)
    expect(store().byId(id)?.scenes.map((s) => (s as { text: string }).text)).toEqual([
      'שני',
      'ראשון',
    ])

    store().removeScene(id, 0)
    expect(store().byId(id)?.scenes).toHaveLength(1)
  })

  it('refuses to move a scene off either end', () => {
    const id = store().createGift('מסע', 'אגמי')
    store().addScene(id, letter('יחיד'))
    store().moveScene(id, 0, -1)
    store().moveScene(id, 0, 1)
    expect(store().byId(id)?.scenes).toHaveLength(1)
  })

  it('patches one scene without disturbing its neighbours', () => {
    const id = store().createGift('מסע', 'אגמי')
    store().addScene(id, letter('א'))
    store().addScene(id, letter('ב'))
    store().updateScene(id, 1, { text: 'שונה' } as Partial<Scene>)
    const scenes = store().byId(id)?.scenes as { text: string }[]
    expect(scenes.map((s) => s.text)).toEqual(['א', 'שונה'])
  })

  it('duplicates a gift without sharing its identity', () => {
    const id = store().createGift('מסע', 'אגמי')
    store().addScene(id, letter('טקסט'))
    const copy = store().duplicateGift(id)!
    expect(copy).not.toBe(id)
    expect(store().byId(copy)?.scenes).toEqual(store().byId(id)?.scenes)

    store().removeScene(copy, 0)
    expect(store().byId(id)?.scenes).toHaveLength(1)
  })

  it('closes the editor when the gift being edited is deleted', () => {
    const id = store().createGift('מסע', 'אגמי')
    store().removeGift(id)
    expect(store().editingId).toBeNull()
  })

  it('replaces a publish record for the same link rather than stacking it', () => {
    const record = {
      id: 'g',
      title: 'גלגל',
      url: 'https://example.test/#/v/abc',
      mode: 'inline' as const,
      publishedAt: '2026-01-01T00:00:00.000Z',
    }
    store().recordPublish(record)
    store().recordPublish({ ...record, publishedAt: '2026-02-01T00:00:00.000Z' })
    expect(store().published).toHaveLength(1)
    expect(store().published[0].publishedAt).toBe('2026-02-01T00:00:00.000Z')

    store().forgetPublish(record.url)
    expect(store().published).toHaveLength(0)
  })
})
