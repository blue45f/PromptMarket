import { cn } from '@utils/cn'
import { useTranslation } from 'react-i18next'

import type { Difficulty } from '@promptmarket/shared'

interface DifficultyBadgeProps {
  difficulty: Difficulty
  className?: string
}

const META: Record<Difficulty, { pill: string; dot: string }> = {
  beginner: {
    pill: 'bg-volt-100 text-volt-800 border-volt-300 dark:bg-volt-900/40 dark:text-volt-200 dark:border-volt-500/40',
    dot: 'bg-volt-500',
  },
  intermediate: {
    pill: 'bg-canvas-deep text-ink border-line dark:bg-night-deep dark:text-bone dark:border-night-line',
    dot: 'bg-iris',
  },
  advanced: {
    pill: 'bg-coral/15 text-coral-deep border-coral/40 dark:bg-coral/20 dark:text-coral dark:border-coral/40',
    dot: 'bg-coral',
  },
}

export default function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const { t } = useTranslation('common')
  const meta = META[difficulty]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.72rem] font-medium border',
        meta.pill,
        className
      )}
    >
      <span aria-hidden className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
      {t(`difficulty.${difficulty}`)}
    </span>
  )
}
