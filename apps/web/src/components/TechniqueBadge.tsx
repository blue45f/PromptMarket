import type { PromptTechnique } from '@promptmarket/shared';
import { TECHNIQUE_META } from '@promptmarket/shared';
import { cn } from '../lib/cn';

interface TechniqueBadgeProps {
  technique: PromptTechnique;
  showHint?: boolean;
  className?: string;
}

export default function TechniqueBadge({
  technique,
  showHint = false,
  className,
}: TechniqueBadgeProps) {
  const meta = TECHNIQUE_META[technique];
  return (
    <span
      title={meta.hint}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ring-1',
        'bg-indigo-50 text-indigo-700 ring-indigo-200',
        'dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-800',
        className,
      )}
    >
      {meta.label}
      {showHint && (
        <span className="hidden sm:inline text-indigo-500 dark:text-indigo-300/80 font-normal">
          {meta.hint}
        </span>
      )}
    </span>
  );
}
