import { cn } from '@utils/cn'
import { Check, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Difficulty, ListingType, PromptTechnique } from '@promptmarket/shared'

/* ---------------------------------------------------------------------------
 * AudienceMatch — "이런 분께 좋아요 / 이럴 땐 다른 걸 보세요" card. Synthesizes
 * fit signals from the listing's own metadata (type, category, difficulty,
 * technique, models). No API change; entirely derived from what the detail
 * page already has.
 * ------------------------------------------------------------------------- */

interface AudienceMatchProps {
  type: ListingType
  category: string
  difficulty?: Difficulty
  technique?: PromptTechnique | null
  models?: string[]
  className?: string
}

/** Which fit / mismatch sentence keys exist per type. Resolved against the
 *  `common:audience.type.*` namespace at render time. */
const TYPE_AUDIENCE: Record<ListingType, { fit: string[]; mismatch: string[] }> = {
  PROMPT: { fit: ['fit1', 'fit2'], mismatch: ['mismatch1'] },
  CLAUDE_MD: { fit: ['fit1', 'fit2'], mismatch: ['mismatch1'] },
  AGENT_MD: { fit: ['fit1'], mismatch: ['mismatch1'] },
  SKILL: { fit: ['fit1', 'fit2'], mismatch: ['mismatch1'] },
  MCP_SERVER: { fit: ['fit1', 'fit2'], mismatch: ['mismatch1'] },
  SLASH_COMMAND: { fit: ['fit1'], mismatch: ['mismatch1'] },
  SUBAGENT: { fit: ['fit1', 'fit2'], mismatch: ['mismatch1'] },
  CURSOR_RULES: { fit: ['fit1'], mismatch: ['mismatch1'] },
}

/** Techniques that carry a fit hint, mirroring the `common:audience.technique.*`
 *  keys. Anything not listed here simply renders no technique line. */
const TECHNIQUE_KEYS: ReadonlySet<NonNullable<PromptTechnique>> = new Set([
  'chain-of-thought',
  'tree-of-thoughts',
  'few-shot',
  'zero-shot',
  'role-prompt',
  'react',
  'rag',
  'reflexion',
  'self-consistency',
  'plan-and-solve',
  'meta-prompt',
])

export default function AudienceMatch({
  type,
  category,
  difficulty,
  technique,
  models,
  className,
}: AudienceMatchProps) {
  const { t } = useTranslation('common')
  const typeBucket = TYPE_AUDIENCE[type]

  const techHint =
    technique && TECHNIQUE_KEYS.has(technique) ? t(`audience.technique.${technique}`) : null

  let modelLine: string | null = null
  if (models && models.length > 0) {
    if (models.includes('any')) modelLine = t('audience.model.any')
    else if (models.length === 1) modelLine = t('audience.model.single', { model: models[0] })
    else modelLine = t('audience.model.multi', { count: models.length })
  }

  const fits = [
    ...typeBucket.fit.map((key) => t(`audience.type.${type}.${key}`)),
    difficulty ? t(`audience.difficultyTone.${difficulty}.fit`) : null,
    techHint ? t('audience.techniqueLine', { hint: techHint }) : null,
    modelLine,
    category ? t('audience.categoryLine', { category }) : null,
  ].filter((s): s is string => !!s)

  const mismatches = [
    ...typeBucket.mismatch.map((key) => t(`audience.type.${type}.${key}`)),
    difficulty ? t(`audience.difficultyTone.${difficulty}.mismatch`) : null,
  ].filter((s): s is string => !!s)

  return (
    <section
      aria-label={t('audience.fitHeading')}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5 sm:p-6',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-volt-700 dark:text-volt-300 inline-flex items-center gap-2">
          <span aria-hidden className="w-5 h-px bg-volt-500" />
          {t('audience.fitHeading')}
        </span>
      </div>
      <ul className="space-y-2.5">
        {fits.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[0.92rem] leading-snug">
            <span
              aria-hidden
              className="mt-0.5 shrink-0 inline-flex w-4 h-4 rounded-full bg-volt-300 text-ink items-center justify-center"
            >
              <Check className="w-3 h-3" />
            </span>
            <span className="text-ink dark:text-bone">{line}</span>
          </li>
        ))}
      </ul>

      {mismatches.length > 0 && (
        <>
          <div className="mt-5 mb-3 inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
            <span aria-hidden className="w-5 h-px bg-ink-mute/60 dark:bg-bone-mute/60" />
            {t('audience.mismatchHeading')}
          </div>
          <ul className="space-y-2">
            {mismatches.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[0.86rem] leading-snug text-ink-mute dark:text-bone-mute"
              >
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 inline-flex w-4 h-4 rounded-full border border-line dark:border-night-line items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
