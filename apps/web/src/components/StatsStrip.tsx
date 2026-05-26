import { useStats } from '@features/marketplace/queries';
import { formatCompact } from '@utils/format';
import { cn } from '@utils/cn';

interface StatsStripProps {
  className?: string;
}

function Stat({
  value,
  label,
  loading,
}: {
  value: string;
  label: string;
  loading: boolean;
}) {
  return (
    <div className="px-6 py-4 sm:py-2 first:pl-0 last:pr-0 text-left">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
        {loading ? (
          <span className="inline-block w-16 h-8 rounded bg-gray-200 dark:bg-zinc-800 motion-safe:animate-pulse align-middle" />
        ) : (
          value
        )}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide font-semibold text-gray-500 dark:text-zinc-400">
        {label}
      </div>
    </div>
  );
}

export default function StatsStrip({ className }: StatsStripProps) {
  const { data, isPending } = useStats();
  // Stay tolerant of a missing/partial stats endpoint — show zeroes rather
  // than blocking the hero.
  const totalListings = data?.totalListings ?? 0;
  const totalSales = data?.totalSales ?? 0;
  const totalUsers = data?.totalUsers ?? 0;

  return (
    <div
      className={cn(
        'grid grid-cols-3 divide-x divide-gray-200 dark:divide-zinc-800 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur ring-1 ring-gray-200 dark:ring-zinc-800',
        className,
      )}
    >
      <Stat
        value={formatCompact(totalListings)}
        label="Listings"
        loading={isPending}
      />
      <Stat
        value={formatCompact(totalSales)}
        label="Downloads"
        loading={isPending}
      />
      <Stat
        value={formatCompact(totalUsers)}
        label="Makers"
        loading={isPending}
      />
    </div>
  );
}
