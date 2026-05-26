import type { Difficulty } from '@promptmarket/shared';
import { cn } from '@utils/cn';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const META: Record<Difficulty, { label: string; pill: string; dark: string }> = {
  beginner: {
    label: 'Beginner',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dark: 'dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800',
  },
  intermediate: {
    label: 'Intermediate',
    pill: 'bg-amber-50 text-amber-700 ring-amber-200',
    dark: 'dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800',
  },
  advanced: {
    label: 'Advanced',
    pill: 'bg-rose-50 text-rose-700 ring-rose-200',
    dark: 'dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800',
  },
};

export default function DifficultyBadge({
  difficulty,
  className,
}: DifficultyBadgeProps) {
  const meta = META[difficulty];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1',
        meta.pill,
        meta.dark,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
