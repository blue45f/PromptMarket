import { cn } from '@utils/cn';

interface SkeletonCardProps {
  className?: string;
}

export default function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden',
        className,
      )}
    >
      <div className="aspect-[4/5] bg-gray-200 dark:bg-zinc-800 motion-safe:animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded motion-safe:animate-pulse" />
        <div className="h-3 w-full bg-gray-200 dark:bg-zinc-800 rounded motion-safe:animate-pulse" />
        <div className="h-3 w-5/6 bg-gray-200 dark:bg-zinc-800 rounded motion-safe:animate-pulse" />
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
          <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded motion-safe:animate-pulse" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-800 rounded motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
