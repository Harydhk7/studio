import { Skeleton } from "@/components/ui/skeleton";

type AdminTableSkeletonProps = {
  title?: string;
  columns?: number;
  rows?: number;
};

export function AdminTableSkeleton({
  title,
  columns = 6,
  rows = 6,
}: AdminTableSkeletonProps) {
  return (
    <div>
      {title ? <h1 className="text-3xl font-bold tracking-tight mb-8">{title}</h1> : null}
      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, idx) => (
              <Skeleton key={`head-${idx}`} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((__, cellIndex) => (
                <Skeleton key={`cell-${rowIndex}-${cellIndex}`} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
