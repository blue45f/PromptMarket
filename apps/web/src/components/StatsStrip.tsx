import { useStats } from '@features/marketplace/queries';
import { useCountUp } from '@hooks/useCountUp';
import { useReveal } from '@hooks/useReveal';
import { formatCompact } from '@utils/format';
import { cn } from '@utils/cn';

interface StatsStripProps {
  className?: string;
}

const ACCENT_DOT: Record<'volt' | 'violet' | 'coral', string> = {
  volt: 'bg-volt-500',
  violet: 'bg-violet',
  coral: 'bg-coral',
};

function Stat({
  target,
  label,
  caption,
  loading,
  accent,
}: {
  target: number;
  label: string;
  caption: string;
  loading: boolean;
  accent: 'volt' | 'violet' | 'coral';
}) {
  const { ref, value } = useCountUp(target);
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="relative flex flex-col gap-3 px-6 py-5 sm:px-8 sm:py-7 group"
    >
      <div className="inline-flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute dark:text-bone-mute">
        <span className={cn('w-1.5 h-1.5 rounded-full', ACCENT_DOT[accent])} />
        {label}
      </div>
      <div
        className={cn(
          'font-mono font-bold text-ink dark:text-bone leading-none tracking-[-0.04em]',
          'tabular-nums',
        )}
        style={{ fontSize: 'var(--text-display-md)' }}
      >
        {loading ? (
          <span className="inline-block w-24 h-[1em] rounded bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse align-middle" />
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
          'motion-safe:[transition:transform_0.9s_cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-x-100',
          ACCENT_DOT[accent],
        )}
      />
    </div>
  );
}

export default function StatsStrip({ className }: StatsStripProps) {
  const { data, isPending } = useStats();
  const totalListings = data?.totalListings ?? 0;
  const totalSales = data?.totalSales ?? 0;
  const totalUsers = data?.totalUsers ?? 0;
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={cn(
        'reveal grid grid-cols-1 sm:grid-cols-3 rounded-3xl overflow-hidden surface-card border border-line dark:border-night-line',
        'divide-y sm:divide-y-0 sm:divide-x divide-line dark:divide-night-line',
        className,
      )}
    >
      <Stat
        target={totalListings}
        label="리스팅"
        caption="커뮤니티가 출시한 프롬프트, 스킬, 에이전트, 룰."
        loading={isPending}
        accent="volt"
      />
      <Stat
        target={totalSales}
        label="다운로드"
        caption="실제 코드베이스로 끌어들여진 횟수. 모든 다운로드가 한 표."
        loading={isPending}
        accent="violet"
      />
      <Stat
        target={totalUsers}
        label="메이커"
        caption="이번 시즌 플랫폼에 게시 중인 빌더들."
        loading={isPending}
        accent="coral"
      />
    </div>
  );
}
