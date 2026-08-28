import { Star } from "lucide-react";

interface StarRatingProps {
  average: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}

export function StarRating({ average, count = 0, size = "md", showCount = true }: StarRatingProps) {
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const full = Math.floor(average);
  const half = average - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center text-amber-500">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f-${i}`} className={`${sizeClass} fill-current`} />
        ))}
        {half > 0 && <Star className={`${sizeClass} fill-current opacity-80`} />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e-${i}`} className={`${sizeClass} text-muted-foreground/30`} />
        ))}
      </div>
      {showCount && count > 0 && (
        <span className="text-xs text-muted-foreground ml-0.5">({count})</span>
      )}
    </div>
  );
}
