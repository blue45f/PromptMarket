import {
  CATEGORIES,
  LISTING_TYPE_META,
  ListingType as ListingTypeEnum,
  PromptTechnique as PromptTechniqueEnum,
  TECHNIQUE_META,
  type Difficulty,
  type ListingType,
} from '@promptmarket/shared'
import { cn } from '@utils/cn'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { countActive, type FilterState } from './filterState'
import ModelPicker from './ModelPicker'

interface FilterPanelProps {
  value: FilterState
  onChange: (next: FilterState) => void
  onReset: () => void
}

const ALL_TYPES = ListingTypeEnum.options
const ALL_TECHNIQUES = PromptTechniqueEnum.options
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

const DIFFICULTY_KEY: Record<'' | Difficulty, string> = {
  '': 'all',
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
}

function handleArrowGroupKey<T extends string>(
  e: React.KeyboardEvent<HTMLDivElement>,
  options: readonly T[],
  setNext: (v: T) => void
) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const buttons = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
  )
  const active = e.currentTarget.querySelector<HTMLButtonElement>('button[aria-checked="true"]')
  const idx = active ? buttons.indexOf(active) : 0
  const len = buttons.length
  const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % len : (idx - 1 + len) % len
  const nextButton = buttons[nextIdx]
  if (!nextButton) return
  e.preventDefault()
  setNext(options[nextIdx])
  nextButton.focus()
}

function SectionHeader({ id, children }: { id: string; children: string }) {
  return (
    <h3
      id={id}
      className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute mb-2.5 inline-flex items-center gap-2"
    >
      <span aria-hidden className="w-3 h-px bg-volt-500/70" />
      {children}
    </h3>
  )
}

function FilterPanel({ value, onChange, onReset }: FilterPanelProps) {
  const { t } = useTranslation('browse')
  const { t: tc } = useTranslation('common')
  const activeCount = countActive(value)
  const resetDisabled = activeCount === 0
  function set<K extends keyof FilterState>(k: K, v: FilterState[K]) {
    onChange({ ...value, [k]: v })
  }
  function toggleType(t: ListingType) {
    set('types', value.types.includes(t) ? value.types.filter((x) => x !== t) : [...value.types, t])
  }
  const showTechnique = value.types.length === 0 || value.types.includes('PROMPT')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-[0.95rem] font-semibold text-ink dark:text-bone tracking-tight">
              {t('panel.title')}
            </p>
            <span
              data-filter-panel-status
              className="inline-flex min-h-6 items-center rounded-full border border-line dark:border-night-line bg-canvas/75 dark:bg-night/60 px-2 text-[0.68rem] font-mono font-semibold text-ink-mute dark:text-bone-mute"
            >
              {resetDisabled
                ? t('panel.summary.empty')
                : t('panel.summary.active', { count: activeCount })}
            </span>
          </div>
          <p className="mt-1 text-[0.78rem] leading-relaxed text-ink-mute dark:text-bone-mute">
            {t('panel.hint')}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={resetDisabled}
          className="shrink-0 min-h-8 rounded px-1 text-[0.78rem] font-medium text-volt-700 dark:text-volt-300 hover:underline underline-offset-[3px] focus-volt disabled:cursor-not-allowed disabled:text-ink-mute/55 disabled:no-underline dark:disabled:text-bone-mute/55"
        >
          {t('panel.reset')}
        </button>
      </div>

      <section aria-labelledby="filter-section-type">
        <SectionHeader id="filter-section-type">{t('panel.sections.type')}</SectionHeader>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPES.map((typeKey) => {
            const meta = LISTING_TYPE_META[typeKey]
            const active = value.types.includes(typeKey)
            return (
              <button
                key={typeKey}
                type="button"
                aria-pressed={active}
                onClick={() => toggleType(typeKey)}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1 px-3 py-1.5 rounded-full text-[0.72rem] font-medium border motion-safe:transition ease-expo focus-volt',
                  active
                    ? 'bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200 border-volt-300 dark:border-volt-700'
                    : 'bg-canvas dark:bg-night text-ink-soft dark:text-bone-soft border-line dark:border-night-line hover:border-volt-400 dark:hover:border-volt-500/50'
                )}
              >
                <span aria-hidden>{meta.emoji}</span>
                {tc('types.' + typeKey, { defaultValue: meta.label })}
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="filter-section-model">
        <SectionHeader id="filter-section-model">{t('panel.sections.model')}</SectionHeader>
        <ModelPicker value={value.models} onChange={(next) => set('models', next)} />
      </section>

      {showTechnique && (
        <section aria-labelledby="filter-section-technique">
          <SectionHeader id="filter-section-technique">
            {t('panel.sections.technique')}
          </SectionHeader>
          <div className="space-y-1" role="radiogroup" aria-labelledby="filter-section-technique">
            <label className="flex min-h-8 items-center gap-2.5 text-[0.86rem] cursor-pointer">
              <input
                type="radio"
                name="technique"
                checked={value.technique === ''}
                onChange={() => set('technique', '')}
                className="accent-volt-500"
              />
              <span className="text-ink-soft dark:text-bone-soft">{t('panel.all')}</span>
            </label>
            {ALL_TECHNIQUES.map((tk) => (
              <label
                key={tk}
                className="flex min-h-8 items-center gap-2.5 text-[0.86rem] cursor-pointer"
              >
                <input
                  type="radio"
                  name="technique"
                  checked={value.technique === tk}
                  onChange={() => set('technique', tk)}
                  className="accent-volt-500"
                />
                <span className="text-ink-soft dark:text-bone-soft">
                  {tc('technique.' + tk + '.label', { defaultValue: TECHNIQUE_META[tk].label })}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="filter-section-category">
        <SectionHeader id="filter-section-category">{t('panel.sections.category')}</SectionHeader>
        <div
          role="radiogroup"
          aria-labelledby="filter-section-category"
          className="grid grid-cols-2 gap-1"
        >
          {CATEGORIES.map((c) => {
            const active = value.category === c
            return (
              <label
                key={c}
                className={cn(
                  'flex min-h-9 items-center gap-2 px-2.5 py-2 rounded-lg text-[0.82rem] cursor-pointer motion-safe:transition ease-expo',
                  active
                    ? 'bg-volt-100 dark:bg-volt-900/40 text-volt-800 dark:text-volt-200'
                    : 'text-ink-soft dark:text-bone-soft hover:bg-canvas-deep dark:hover:bg-night-deep'
                )}
              >
                <input
                  type="radio"
                  name="category"
                  checked={active}
                  onChange={() => set('category', active ? '' : c)}
                  className="accent-volt-500"
                />
                <span className="truncate">
                  {t('home:categories.labels.' + c, { defaultValue: c })}
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="filter-section-difficulty">
        <SectionHeader id="filter-section-difficulty">
          {t('panel.sections.difficulty')}
        </SectionHeader>
        {/* Roving-tabindex radiogroup: focus lives on the active role="radio"
            child (tabIndex 0/-1) and arrow keys move it via onKeyDown here, so
            the container itself is intentionally not in the tab order. */}
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tabindex on radio children */}
        <div
          role="radiogroup"
          aria-label={t('panel.difficultyGroup')}
          onKeyDown={(e) =>
            handleArrowGroupKey(e, ['', ...DIFFICULTIES] as const, (next) =>
              set('difficulty', next as FilterState['difficulty'])
            )
          }
          className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-canvas-deep dark:bg-night-deep border border-line dark:border-night-line"
        >
          {(['', ...DIFFICULTIES] as const).map((d) => {
            const active = value.difficulty === d
            return (
              <button
                key={d || 'all'}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => set('difficulty', d as FilterState['difficulty'])}
                className={cn(
                  'min-h-9 text-[0.74rem] font-medium px-1 py-1.5 rounded-lg motion-safe:transition ease-expo focus-volt',
                  active
                    ? 'bg-canvas dark:bg-night text-ink dark:text-bone shadow-[0_4px_12px_-6px_oklch(0.16_0.03_290_/_0.4)]'
                    : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone'
                )}
              >
                {t(`panel.difficulty.${DIFFICULTY_KEY[d as '' | Difficulty]}`)}
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="filter-section-price">
        <SectionHeader id="filter-section-price">{t('panel.sections.price')}</SectionHeader>
        {/* Roving-tabindex radiogroup: focus lives on the active role="radio"
            child (tabIndex 0/-1) and arrow keys move it via onKeyDown here, so
            the container itself is intentionally not in the tab order. */}
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tabindex on radio children */}
        <div
          role="radiogroup"
          aria-label={t('panel.priceGroup')}
          onKeyDown={(e) =>
            handleArrowGroupKey(e, ['all', 'free', 'paid'] as const, (next) => set('price', next))
          }
          className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-canvas-deep dark:bg-night-deep border border-line dark:border-night-line"
        >
          {(['all', 'free', 'paid'] as const).map((p) => {
            const active = value.price === p
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => set('price', p)}
                className={cn(
                  'min-h-9 text-[0.74rem] font-medium px-2 py-1.5 rounded-lg motion-safe:transition ease-expo focus-volt',
                  active
                    ? 'bg-canvas dark:bg-night text-ink dark:text-bone shadow-[0_4px_12px_-6px_oklch(0.16_0.03_290_/_0.4)]'
                    : 'text-ink-mute dark:text-bone-mute hover:text-ink dark:hover:text-bone'
                )}
              >
                {t(`panel.price.${p}`)}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default React.memo(FilterPanel)
