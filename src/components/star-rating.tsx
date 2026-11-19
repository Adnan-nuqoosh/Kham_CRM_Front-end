import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 text-stone", className)}>
      <span className="flex" aria-label={`${rating} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 12 12" className="size-3" aria-hidden>
            <path
              d="M6 1.2 7.4 4.3l3.4.4-2.5 2.3.7 3.4L6 8.8 3 10.4l.7-3.4L1.2 4.7l3.4-.4L6 1.2Z"
              fill={i < Math.round(rating) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </svg>
        ))}
      </span>
      {typeof count === "number" && (
        <span className="text-[11px] text-muted">({count})</span>
      )}
    </div>
  );
}
