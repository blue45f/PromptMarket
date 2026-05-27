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
    <div className="relative isolate overflow-hidden rounded-3xl surface-card border-line dark:border-night-line text-center py-16 px-6">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            'radial-gradient(at 50% 0%, oklch(0.92 0.18 122 / 0.25) 0, transparent 55%)',
        }}
      />
      <div className="text-[3.5rem] mb-3 leading-none" aria-hidden>
        {emoji}
      </div>
      <h3 className="font-display text-[1.25rem] font-bold text-ink dark:text-bone tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-ink-mute dark:text-bone-mute max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
