import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, CircleAlert, ListChecks } from 'lucide-react'
import type { ListingType } from '@promptmarket/shared'
import { extractTemplateVariables } from './ArtifactReadiness'
import { cn } from '@utils/cn'

export interface ListingQualityInput {
  title?: string | null
  description?: string | null
  body?: string | null
  type: ListingType
  tags?: string | string[] | null
  models?: string[] | null
  version?: string | null
}

type QualityKey = 'useCase' | 'bodyDepth' | 'inputs' | 'metadata'
type ListingSection = 'basics' | 'content' | 'metadata'

export interface QualityItem {
  key: QualityKey
  passed: boolean
}

export interface ListingQualityResult {
  complete: number
  total: number
  items: QualityItem[]
  variables: string[]
  tagCount: number
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
const CONFIG_PATTERN = /\b(api|token|key|env|config|secret|header|query|설정|환경|토큰|키)\b/i
const TARGET_SECTION_BY_QUALITY: Record<QualityKey, ListingSection> = {
  useCase: 'basics',
  bodyDepth: 'content',
  inputs: 'content',
  metadata: 'metadata',
}

export function evaluateListingQuality(input: ListingQualityInput): ListingQualityResult {
  const title = input.title?.trim() ?? ''
  const description = input.description?.trim() ?? ''
  const body = input.body?.trim() ?? ''
  const variables = extractTemplateVariables(body)
  const tagCount = normalizeTags(input.tags).length
  const models = input.models?.filter(Boolean) ?? []
  const version = input.version?.trim() ?? ''

  const useCase = title.length >= 12 && description.length >= 40
  const bodyDepth = body.length >= 120
  const inputs =
    input.type === 'PROMPT'
      ? variables.length > 0
      : variables.length > 0 || CONFIG_PATTERN.test(body)
  const metadata = models.length > 0 && tagCount >= 2 && SEMVER_PATTERN.test(version)

  const items: QualityItem[] = [
    { key: 'useCase', passed: useCase },
    { key: 'bodyDepth', passed: bodyDepth },
    { key: 'inputs', passed: inputs },
    { key: 'metadata', passed: metadata },
  ]

  return {
    complete: items.filter((item) => item.passed).length,
    total: items.length,
    items,
    variables,
    tagCount,
  }
}

export default function ListingQualityChecklist({
  className,
  onJumpToSection,
  ...input
}: ListingQualityInput & {
  className?: string
  onJumpToSection?: (section: ListingSection) => void
}) {
  const { t } = useTranslation('create')
  const result = useMemo(
    () => evaluateListingQuality(input),
    [
      input.title,
      input.description,
      input.body,
      input.type,
      input.tags,
      input.models,
      input.version,
    ]
  )
  const ready = result.complete === result.total

  return (
    <section
      aria-labelledby="listing-quality-heading"
      className={cn(
        'rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              ready
                ? 'bg-volt-300 text-ink'
                : 'bg-canvas-deep text-ink-soft dark:bg-night-deep dark:text-bone-soft'
            )}
          >
            <ListChecks className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2
              id="listing-quality-heading"
              className="font-display text-[1rem] font-semibold leading-tight tracking-tight text-ink dark:text-bone"
            >
              {t('quality.title')}
            </h2>
            <p className="mt-1 text-[0.76rem] leading-snug text-ink-mute dark:text-bone-mute">
              {ready ? t('quality.ready') : t('quality.subtitle')}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 font-mono text-[0.78rem] font-semibold tabular-nums',
            ready
              ? 'border-volt-300 bg-volt-200/70 text-ink dark:border-volt-700 dark:bg-volt-900/50 dark:text-volt-100'
              : 'border-line bg-canvas text-ink-soft dark:border-night-line dark:bg-night dark:text-bone-soft'
          )}
        >
          {result.complete}/{result.total}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {result.items.map((item) => (
          <li key={item.key} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className={cn(
                'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                item.passed
                  ? 'bg-volt-300 text-ink'
                  : 'bg-canvas-deep text-ink-mute dark:bg-night-deep dark:text-bone-mute'
              )}
            >
              {item.passed ? <Check className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
            </span>
            <div className="min-w-0">
              <p className="text-[0.86rem] font-semibold leading-snug text-ink dark:text-bone">
                {t(`quality.items.${item.key}.title`)}
              </p>
              <p className="text-[0.74rem] leading-snug text-ink-mute dark:text-bone-mute">
                {t(`quality.items.${item.key}.${item.passed ? 'done' : 'todo'}`)}
              </p>
              {!item.passed && onJumpToSection && (
                <button
                  type="button"
                  onClick={() => onJumpToSection(TARGET_SECTION_BY_QUALITY[item.key])}
                  className={cn(
                    'mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
                    'text-[0.72rem] font-medium motion-safe:transition ease-expo',
                    'focus-volt border-volt-400/55 text-ink/85 hover:border-volt-500 hover:text-ink',
                    'dark:border-volt-500/55 dark:text-volt-100 dark:hover:border-volt-400'
                  )}
                >
                  <span>
                    {t('quality.quickJumpSection', {
                      section: t(`sectionTabs.${TARGET_SECTION_BY_QUALITY[item.key]}`),
                    })}
                  </span>
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {result.variables.length > 0 && (
        <div className="mt-4 rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night p-3">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
            {t('quality.variables')}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {result.variables.map((variable) => (
              <li
                key={variable}
                className="max-w-full break-all rounded-full border border-volt-400/45 bg-volt-100/70 px-2 py-0.5 font-mono text-[0.7rem] text-ink dark:border-volt-500/35 dark:bg-volt-900/30 dark:text-volt-100"
              >
                {variable}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.complete < result.total && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-coral-500/25 bg-coral-100/45 dark:bg-coral-900/25 px-3 py-2 text-[0.74rem] text-coral-800 dark:text-coral-100"
        >
          {t('quality.publishHint', {
            ready: result.complete,
            total: result.total,
            remain: result.total - result.complete,
          })}
        </p>
      )}
    </section>
  )
}

function normalizeTags(tags: ListingQualityInput['tags']): string[] {
  if (Array.isArray(tags)) return tags.map((tag) => tag.trim()).filter(Boolean)
  return (tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}
