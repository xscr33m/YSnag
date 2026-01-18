interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded bg-white/5 ${className}`}
      aria-hidden="true"
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonThumbnail({ className = "" }: { className?: string }) {
  return <Skeleton className={`aspect-video rounded-lg ${className}`} />;
}

// Queue Item Skeleton
export function QueueItemSkeleton() {
  return (
    <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-lg md:rounded-xl border border-white/10 p-3 md:p-4">
      <div className="flex items-start gap-3 md:gap-4">
        {/* Thumbnail skeleton */}
        <Skeleton className="w-24 h-16 md:w-32 md:h-20 rounded-md md:rounded-lg flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />

          {/* Channel + Duration */}
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* Action button skeleton */}
        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

// History Item Skeleton
export function HistoryItemSkeleton() {
  return (
    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] rounded-lg md:rounded-xl border border-white/10 p-3 md:p-4 flex gap-3 md:gap-4">
      {/* Thumbnail skeleton */}
      <Skeleton className="w-24 h-16 md:w-32 md:h-20 rounded-md md:rounded-lg flex-shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Title */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />

        {/* Channel */}
        <Skeleton className="h-3 w-24 mt-1" />

        {/* Tags row */}
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

// Video Preview Skeleton (for larger previews)
export function VideoPreviewSkeleton() {
  return (
    <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] rounded-xl border border-white/10 overflow-hidden">
      {/* Thumbnail */}
      <Skeleton className="w-full aspect-video" />

      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
