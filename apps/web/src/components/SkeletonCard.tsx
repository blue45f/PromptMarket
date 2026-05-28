import { cn } from '@utils/cn';

interface SkeletonCardProps {
  className?: string;
}

export default function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'surface-card rounded-[1.4rem] overflow-hidden',
        className,
      )}
    >
      <div className="aspect-[4/5] bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse" />
        <div className="h-3 w-full bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse" />
        <div className="h-3 w-5/6 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse" />
        <div className="flex items-center justify-between pt-3 border-t border-line dark:border-night-line">
          <div className="h-3 w-16 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse" />
          <div className="h-3 w-12 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="cards-fluid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
