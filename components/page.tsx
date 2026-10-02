import { ArrowLeft } from "@phosphor-icons/react/ssr";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 grid gap-3">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="size-4" /> {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid min-w-0 gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
          {description ? <div className="max-w-prose text-muted-foreground">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Section({ title, children, className, aside }: { title: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={cn("grid content-start gap-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-white ring-1 ring-line", className)}>{children}</div>;
}

/** Status pill. `danger` is Signal: only for suspended / failing states. */
export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "ok" | "danger" | "ink"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[0.8125rem] font-medium whitespace-nowrap",
        tone === "neutral" && "bg-paper-deep text-ink",
        tone === "ok" && "bg-volt text-ink",
        tone === "danger" && "bg-signal text-ink",
        tone === "ink" && "bg-ink text-paper",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="grid justify-items-start gap-2 rounded-2xl border border-dashed border-line px-6 py-10">
      <p className="font-bold">{title}</p>
      {children ? <div className="max-w-prose text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}
