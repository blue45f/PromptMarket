export default function SkeletonDetail() {
  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(2rem,4vw,3.5rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <div className="aspect-[16/9] rounded-2xl bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse" />
          <div className="h-9 w-2/3 bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-full bg-canvas-deep dark:bg-night-sub rounded motion-safe:animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4 min-w-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-canvas-deep dark:bg-night-sub motion-safe:animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
