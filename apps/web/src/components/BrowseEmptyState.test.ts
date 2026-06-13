import { describe, expect, it, vi } from 'vitest'
import { buildActiveFilterRows } from './browseEmptyStateUtils'

function noop() {}

describe('buildActiveFilterRows', () => {
  const baseArgs = {
    q: '',
    types: [],
    models: [],
    technique: '',
    difficulty: '',
    category: '',
    price: 'all',
    removeType: noop,
    removeModel: noop,
    removeTechnique: noop,
    removeDifficulty: noop,
    removeCategory: noop,
    removePrice: noop,
    removeQuery: noop,
  }

  it('returns an empty list when nothing is active', () => {
    expect(buildActiveFilterRows(baseArgs)).toEqual([])
  })

  it('emits one row per dimension and embeds the value in the label', () => {
    const rows = buildActiveFilterRows({
      ...baseArgs,
      q: 'agents',
      types: ['PROMPT', 'SKILL'],
      models: ['claude-opus-4-7'],
      technique: 'chain-of-thought',
      difficulty: 'beginner',
      category: 'Coding',
      price: 'free',
    })
    const labels = rows.map((r) => r.label)
    // 1 query + 2 types + 1 model + 1 technique + 1 difficulty + 1 category + 1 price = 8
    expect(labels.length).toBe(8)
    expect(labels.some((l) => l.includes('agents'))).toBe(true)
    expect(labels.filter((l) => l.startsWith('타입 ·')).length).toBe(2)
    expect(labels.some((l) => l.startsWith('모델 ·'))).toBe(true)
    expect(labels.some((l) => l.startsWith('기법'))).toBe(true)
    expect(labels.some((l) => l.startsWith('난이도'))).toBe(true)
    expect(labels.some((l) => l.startsWith('카테고리'))).toBe(true)
    expect(labels.some((l) => l.startsWith('가격'))).toBe(true)
  })

  it('forwards the removed value into the per-row remove callback', () => {
    const removeType = vi.fn()
    const removeModel = vi.fn()
    const rows = buildActiveFilterRows({
      ...baseArgs,
      types: ['PROMPT'],
      models: ['gpt-5', 'claude-haiku-4-5'],
      removeType,
      removeModel,
    })
    const typeRow = rows.find((r) => r.key === 'type:PROMPT')
    typeRow?.onRemove()
    expect(removeType).toHaveBeenCalledWith('PROMPT')

    const modelRow = rows.find((r) => r.key === 'model:gpt-5')
    modelRow?.onRemove()
    expect(removeModel).toHaveBeenCalledWith('gpt-5')
  })

  it('omits price when it is set to "all"', () => {
    const rows = buildActiveFilterRows({ ...baseArgs, price: 'all' })
    expect(rows.find((r) => r.key === 'price')).toBeUndefined()
  })
})
