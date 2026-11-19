import { formatPrice, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  egp,
  currency,
  compareAt,
  className,
}: {
  egp: number;
  currency: Currency;
  compareAt?: number;
  className?: string;
}) {
  return (
    <span className={cn("tabular-nums text-sm text-ink", className)}>
      {formatPrice(egp, currency)}
      {compareAt ? (
        <span className="ms-2 text-muted line-through">
          {formatPrice(compareAt, currency)}
        </span>
      ) : null}
    </span>
  );
}
