import { cn } from "@/lib/utils";

/** The Anodyx mark (never redrawn) with the wordmark and the ADMIN tag. */
export function AdminMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG */}
      <img src="/brand/anodyx-mark-inverse.svg" width={size} height={size} alt="" />
      <span className="wordmark text-lg text-paper">anodyx</span>
      <span className="label-mono rounded-md bg-volt px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink">Admin</span>
    </span>
  );
}
