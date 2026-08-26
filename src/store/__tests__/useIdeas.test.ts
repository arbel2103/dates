import { beforeEach, describe, expect, it } from 'vitest'
import { categoriesOf, useIdeas } from '../useIdeas'
import { seedIdeas } from '../../seed/ideas'

const store = () => useIdeas.getState()

beforeEach(() => {
  useIdeas.setState({ ideas: seedIdeas() })
})

describe('ideas', () => {
  it('starts with a library that is already usable', () => {
    expect(store().ideas.length).toBeGreaterThan(30)
    expect(categoriesOf(store().ideas).length).toBeGreaterThan(4)
  })

  it('adds a new idea at the top, trimmed and with defaults filled in', () => {
    const id = store().addIdea({ title: '  ערב יין  ', emoji: '', category: '' })
    const idea = store().ideas[0]
    expect(idea.id).toBe(id)
    expect(idea.title).toBe('ערב יין')
    expect(idea.emoji).toBe('💡')
    expect(idea.category).toBe('כללי')
  })

  it('edits, favourites and deletes', () => {
    const id = store().addIdea({ title: 'רעיון', emoji: '💡', category: 'כללי' })
    store().updateIdea(id, { title: 'רעיון טוב יותר' })
    expect(store().ideas[0].title).toBe('רעיון טוב יותר')

    store().toggleFavorite(id)
    expect(store().ideas[0].favorite).toBe(true)
    store().toggleFavorite(id)
    expect(store().ideas[0].favorite).toBe(false)

    store().removeIdea(id)
    expect(store().ideas.some((i) => i.id === id)).toBe(false)
  })

  it('restores seeds without duplicating the ones still there', () => {
    const before = store().ideas.length
    store().removeIdea('seed-0')
    store().restoreSeeds()
    expect(store().ideas).toHaveLength(before)
  })

  it('leaves written ideas alone when seeds are restored', () => {
    store().addIdea({ title: 'שלי', emoji: '✨', category: 'כללי' })
    store().restoreSeeds()
    expect(store().ideas.filter((i) => i.title === 'שלי')).toHaveLength(1)
  })
})
