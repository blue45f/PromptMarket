import { cn } from '@utils/cn'
import { modelLabel, modelVendor } from '@utils/format'

interface ModelBadgeProps {
  slug: string
  className?: string
  size?: 'sm' | 'md'
}

export default function ModelBadge({ slug, className, size = 'sm' }: ModelBadgeProps) {
  return (
    <span
      title={modelVendor(slug)}
      className={cn(
        'inline-flex items-center rounded-md font-mono font-medium',
        'bg-canvas-deep text-ink-soft border border-line/70',
        'dark:bg-night-deep dark:text-bone-soft dark:border-night-line/70',
        size === 'sm' ? 'text-[0.65rem] px-1.5 py-0.5' : 'text-[0.72rem] px-2 py-0.5',
        className
      )}
    >
      {modelLabel(slug)}
    </span>
  )
}
