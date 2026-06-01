import { useTranslation } from 'react-i18next'
import { useStats } from '@features/marketplace/queries'
import { useCountUp } from '@hooks/useCountUp'
import { useReveal } from '@hooks/useReveal'
import { formatCompact } from '@utils/format'
import { cn } from '@utils/cn'

interface StatsStripProps {
  className?: string
}

const ACCENT_DOT: Record<'volt' | 'violet' | 'coral', string> = {
  volt: 'bg-volt-500',
  violet: 'bg-violet',
  coral: 'bg-coral',
}

function Stat({
  target,
  label,
  caption,
  loading,
  error,
  accent,
}: {
  target: number
  label: string
  caption: string
  loading: boolean
  error: boolean
  accent: 'volt' | 'violet' | 'coral'
}) {
  const { ref, value } = useCountUp(target)
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="relative flex min-w-0 snap-start scroll-ml-4 flex-col gap-3 px-6 py-5 sm:scroll-ml-0 sm:px-8 sm:py-7 group"
    >
      <div className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
        <span className={cn('w-1.5 h-1.5 rounded-full', ACCENT_DOT[accent])} />
        {label}
      </div>
      <div
        className={cn(
          'font-mono font-bold text-ink dark:text-bone leading-none tracking-[-0.04em]',
          'tabular-nums'
        )}
        style={{ fontSize: 'var(--text-display-md)' }}
      >
        {loading ? (
          <span className="inline-block w-24 h-[1em] rounded bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse align-middle" />
        ) : error ? (
          <span aria-label="-">-</span>
        ) : (
          <span aria-label={String(target)}>{formatCompact(value)}</span>
        )}
      </div>
      <p className="text-[0.78rem] text-ink-mute dark:text-bone-mute leading-snug max-w-[18ch]">
        {caption}
      </p>
      {/* Hairline accent that slides in on view */}
      <span
        aria-hidden
        className={cn(
          'absolute left-6 sm:left-8 right-6 sm:right-8 bottom-0 h-px origin-left scale-x-0',
          'motion-safe:transition-transform motion-safe:duration-[900ms] ease-expo motion-safe:group-hover:scale-x-100',
          ACCENT_DOT[accent]
        )}
      />
    </div>
  )
}

export default function StatsStrip({ className }: StatsStripProps) {
  const { t } = useTranslation('nav')
  const { data, isPending, isError } = useStats()
  const totalListings = data?.totalListings ?? 0
  const totalDownloads = data?.totalDownloads ?? 0
  const totalCreators = data?.totalCreators ?? 0
  const { ref, revealed } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      data-stats-strip
      data-revealed={revealed}
      className={cn(
        'reveal grid grid-flow-col auto-cols-[minmax(16rem,82vw)] sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3',
        'rounded-3xl overflow-x-auto sm:overflow-hidden snap-x snap-mandatory sm:snap-none scrollbar-hide overscroll-x-contain surface-card border border-line dark:border-night-line',
        'divide-x divide-line dark:divide-night-line',
        className
      )}
    >
      <Stat
        target={totalListings}
        label={t('stats.listings')}
        caption={t('stats.captions.listings')}
        loading={isPending}
        error={isError}
        accent="volt"
      />
      <Stat
        target={totalDownloads}
        label={t('stats.downloads')}
        caption={t('stats.captions.downloads')}
        loading={isPending}
        error={isError}
        accent="violet"
      />
      <Stat
        target={totalCreators}
        label={t('stats.makers')}
        caption={t('stats.captions.makers')}
        loading={isPending}
        error={isError}
        accent="coral"
      />
    </div>
  )
}
