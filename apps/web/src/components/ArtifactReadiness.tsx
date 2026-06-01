import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Braces, Layers3, ListChecks, Terminal, type LucideIcon } from 'lucide-react'
import type { ListingType } from '@promptmarket/shared'
import { cn } from '@utils/cn'

interface ArtifactReadinessProps {
  type: ListingType
  body?: string | null
  previewBody?: string | null
  canViewBody?: boolean
  models?: string[] | null
  className?: string
}

type SourceState = 'full' | 'preview' | 'locked'

const VARIABLE_PATTERN = /\{\{\s*([A-Za-z][\w.-]{0,48})\s*\}\}/g

export function extractTemplateVariables(source?: string | null): string[] {
  if (!source) return []

  const variables: string[] = []
  const seen = new Set<string>()

  for (const match of source.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]
    if (!name || seen.has(name)) continue
    seen.add(name)
    variables.push(name)
  }

  return variables
}

export default function ArtifactReadiness({
  type,
  body,
  previewBody,
  canViewBody,
  models,
  className,
}: ArtifactReadinessProps) {
  const { t } = useTranslation('detail')
  const titleId = useId()
  const modelCount = models?.filter(Boolean).length ?? 0

  const sourceState: SourceState = canViewBody && body ? 'full' : previewBody ? 'preview' : 'locked'
  const source = sourceState === 'full' ? body : sourceState === 'preview' ? previewBody : ''
  const variables = useMemo(() => extractTemplateVariables(source), [source])

  const items: Array<{
    key: string
    Icon: LucideIcon
    label: string
    value: string
    tone: string
  }> = [
    {
      key: 'target',
      Icon: Terminal,
      label: t('readiness.labels.target'),
      value: t(`readiness.targets.${type}`),
      tone: 'bg-ink text-volt-300 dark:bg-volt-300 dark:text-ink',
    },
    {
      key: 'scope',
      Icon: ListChecks,
      label: t('readiness.labels.scope'),
      value: t(`readiness.scope.${sourceState}`),
      tone: 'bg-canvas-deep text-ink-soft dark:bg-night-deep dark:text-bone-soft',
    },
    {
      key: 'models',
      Icon: Layers3,
      label: t('readiness.labels.models'),
      value:
        modelCount > 0
          ? t('readiness.models.count', { count: modelCount })
          : t('readiness.models.any'),
      tone: 'bg-iris/10 text-iris-deep dark:text-iris',
    },
  ]

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'rounded-2xl border border-line dark:border-night-line bg-canvas-sub dark:bg-night-sub p-5 sm:p-6',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-volt-300 text-ink"
        >
          <Braces className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2
            id={titleId}
            className="font-display text-[1.05rem] font-semibold leading-none tracking-tight text-ink dark:text-bone"
          >
            {t('readiness.title')}
          </h2>
          <p className="mt-1 text-[0.78rem] leading-snug text-ink-mute dark:text-bone-mute">
            {t('readiness.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map(({ key, Icon, label, value, tone }) => (
          <div
            key={key}
            className="min-w-0 rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night p-3"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  tone
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className="min-w-0 text-[0.68rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
                {label}
              </p>
            </div>
            <p className="mt-2 break-words text-[0.9rem] font-semibold leading-snug text-ink dark:text-bone">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-line dark:border-night-line bg-canvas dark:bg-night p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.78rem] font-semibold text-ink dark:text-bone">
            {t('readiness.labels.variables')}
          </p>
          <span className="text-[0.68rem] font-mono uppercase tracking-[0.16em] text-ink-mute dark:text-bone-mute">
            {t('readiness.variables.count', { count: variables.length })}
          </span>
        </div>
        {variables.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {variables.map((variable) => (
              <li
                key={variable}
                className="max-w-full break-all rounded-full border border-volt-400/45 bg-volt-100/70 px-2.5 py-1 font-mono text-[0.72rem] font-medium text-ink dark:border-volt-500/35 dark:bg-volt-900/30 dark:text-volt-100"
              >
                {variable}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-snug text-ink-mute dark:text-bone-mute">
            {t('readiness.variables.empty')}
          </p>
        )}
      </div>
    </section>
  )
}
