import type { PromptTechnique } from '@promptmarket/shared';
import { TECHNIQUE_META } from '@promptmarket/shared';
import { cn } from '@utils/cn';

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
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.72rem] font-medium border',
        'bg-violet-soft/60 text-violet-deep border-violet/30',
        'dark:bg-violet/15 dark:text-violet-soft dark:border-violet/30',
        className,
      )}
    >
      {meta.label}
      {showHint && (
        <span className="hidden sm:inline text-violet/80 dark:text-violet-soft/80 font-normal">
          {meta.hint}
        </span>
      )}
    </span>
  );
}
