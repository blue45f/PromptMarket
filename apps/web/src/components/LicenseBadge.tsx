import type { License } from '@promptmarket/shared';
import { cn } from '@utils/cn';

interface LicenseBadgeProps {
  license: License;
  className?: string;
}

export default function LicenseBadge({ license, className }: LicenseBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium ring-1',
        'bg-slate-100 text-slate-700 ring-slate-200',
        'dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700',
        className,
      )}
    >
      {license}
    </span>
  );
}
