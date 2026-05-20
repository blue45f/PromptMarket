import { modelLabel, modelVendor } from '../lib/format';
import { cn } from '../lib/cn';

interface ModelBadgeProps {
  slug: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function ModelBadge({ slug, className, size = 'sm' }: ModelBadgeProps) {
  return (
    <span
      title={modelVendor(slug)}
      className={cn(
        'inline-flex items-center rounded-md font-medium ring-1',
        'bg-gray-100 text-gray-700 ring-gray-200',
        'dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        className,
      )}
    >
      {modelLabel(slug)}
    </span>
  );
}
