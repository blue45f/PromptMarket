import { Loader2 } from 'lucide-react'
import { cn } from '@utils/cn'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

export default function Spinner({ size = 24, className = '', label }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 text-ink-mute dark:text-bone-mute',
        className
      )}
    >
      <Loader2
        aria-hidden="true"
        className="motion-safe:animate-spin text-volt-700 dark:text-volt-300"
        style={{ width: size, height: size }}
      />
      {label ? (
        <span className="text-sm">{label}</span>
      ) : (
        <span className="sr-only">Loading...</span>
      )}
    </div>
  )
}
