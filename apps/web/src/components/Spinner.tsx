import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export default function Spinner({ size = 24, className = '', label }: SpinnerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-gray-500 dark:text-zinc-400',
        className,
      )}
    >
      <Loader2
        className="motion-safe:animate-spin text-indigo-600 dark:text-indigo-400"
        style={{ width: size, height: size }}
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
