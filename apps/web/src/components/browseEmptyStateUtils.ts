import i18n from '@/i18n'
import { modelLabel } from '@utils/format'

export interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

export function buildActiveFilterRows(args: {
  q: string
  types: string[]
  models: string[]
  technique: string
  difficulty: string
  category: string
  price: string
  signals?: string[]
  removeType: (t: string) => void
  removeModel: (m: string) => void
  removeTechnique: () => void
  removeDifficulty: () => void
  removeCategory: () => void
  removePrice: () => void
  removeQuery: () => void
  removeSignal?: (s: string) => void
}): ActiveFilter[] {
  const out: ActiveFilter[] = []
  if (args.q)
    out.push({
      key: 'q',
      label: i18n.t('browse:activeFilter.query', { q: args.q }),
      onRemove: args.removeQuery,
    })
  for (const t of args.types) {
    out.push({
      key: `type:${t}`,
      label: i18n.t('browse:activeFilter.type', {
        value: i18n.t('common:types.' + t, { defaultValue: t }),
      }),
      onRemove: () => args.removeType(t),
    })
  }
  for (const m of args.models) {
    out.push({
      key: `model:${m}`,
      label: i18n.t('browse:activeFilter.model', { value: modelLabel(m) }),
      onRemove: () => args.removeModel(m),
    })
  }
  if (args.technique)
    out.push({
      key: 'technique',
      label: i18n.t('browse:activeFilter.technique', {
        value: i18n.t('common:technique.' + args.technique + '.label', {
          defaultValue: args.technique,
        }),
      }),
      onRemove: args.removeTechnique,
    })
  if (args.difficulty)
    out.push({
      key: 'difficulty',
      label: i18n.t('browse:activeFilter.difficulty', {
        value: i18n.t('common:difficulty.' + args.difficulty, {
          defaultValue: args.difficulty,
        }),
      }),
      onRemove: args.removeDifficulty,
    })
  if (args.category)
    out.push({
      key: 'category',
      label: i18n.t('browse:activeFilter.category', { value: args.category }),
      onRemove: args.removeCategory,
    })
  if (args.price && args.price !== 'all')
    out.push({
      key: 'price',
      label: i18n.t('browse:activeFilter.price', { value: args.price }),
      onRemove: args.removePrice,
    })
  for (const signal of args.signals ?? []) {
    out.push({
      key: `signal:${signal}`,
      label: i18n.t('browse:activeFilter.signal', {
        value: i18n.t('browse:signals.options.' + signal, { defaultValue: signal }),
      }),
      onRemove: () => args.removeSignal?.(signal),
    })
  }
  return out
}
