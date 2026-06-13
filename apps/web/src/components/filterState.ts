import type { Difficulty, ListingType, PromptTechnique } from '@promptmarket/shared'

export interface FilterState {
  types: ListingType[]
  models: string[]
  technique: PromptTechnique | ''
  difficulty: Difficulty | ''
  category: string
  price: 'all' | 'free' | 'paid'
}

export function emptyFilters(): FilterState {
  return {
    types: [],
    models: [],
    technique: '',
    difficulty: '',
    category: '',
    price: 'all',
  }
}

export function countActive(f: FilterState): number {
  return (
    f.types.length +
    f.models.length +
    (f.technique ? 1 : 0) +
    (f.difficulty ? 1 : 0) +
    (f.category ? 1 : 0) +
    (f.price !== 'all' ? 1 : 0)
  )
}
