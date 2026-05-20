export default function SkeletonDetail() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="aspect-[16/9] rounded-2xl bg-gray-200 dark:bg-zinc-800 motion-safe:animate-pulse" />
          <div className="h-8 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded motion-safe:animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded motion-safe:animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-gray-200 dark:bg-zinc-800 motion-safe:animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
