import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  emoji = '📭',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
      <div className="text-5xl mb-3" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
