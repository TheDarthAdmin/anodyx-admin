import { formatNumber, usageShare } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Used vs plan limit. The bar only appears when there is a limit to compare against. */
export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const share = usageShare(used, limit);
  const full = share !== null && share >= 0.9;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="num text-sm">
          <span className="text-base font-medium text-ink">{formatNumber(used)}</span>
          {limit !== null ? <span className="text-muted-foreground"> / {formatNumber(limit)}</span> : <span className="text-muted-foreground"> onbeperkt</span>}
        </span>
      </div>
      {share !== null ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-paper-deep"
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={limit ?? undefined}
          aria-valuenow={used}
        >
          <div className={cn("h-full rounded-full", full ? "bg-signal" : "bg-ink")} style={{ width: `${Math.max(2, share * 100)}%` }} />
        </div>
      ) : null}
    </div>
  );
}
