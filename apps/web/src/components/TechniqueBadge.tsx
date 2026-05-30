import type { PromptTechnique } from '@promptmarket/shared'
import { TECHNIQUE_META } from '@promptmarket/shared'
import { useTranslation } from 'react-i18next'
import { cn } from '@utils/cn'

interface TechniqueBadgeProps {
  technique: PromptTechnique
  showHint?: boolean
  className?: string
}

export default function TechniqueBadge({
  technique,
  showHint = false,
  className,
}: TechniqueBadgeProps) {
  const meta = TECHNIQUE_META[technique]
  const { t } = useTranslation('common')
  return (
    <span
      title={t('audience.technique.' + technique, { ns: 'common', defaultValue: meta.hint })}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.72rem] font-medium border',
        'bg-violet-soft/60 text-violet-deep border-violet/30',
        'dark:bg-violet/15 dark:text-violet-soft dark:border-violet/30',
        className
      )}
    >
      {t('technique.' + technique + '.label', { defaultValue: meta.label })}
      {showHint && (
        <span className="hidden sm:inline text-violet/80 dark:text-violet-soft/80 font-normal">
          {t('audience.technique.' + technique, { ns: 'common', defaultValue: meta.hint })}
        </span>
      )}
    </span>
  )
}
