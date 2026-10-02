import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader, Panel, Pill, Section } from "@/components/page";
import { actionLabel, formatDateTime, formatNumber, PLAN_LABELS, PLANS } from "@/lib/format";
import { platformGet } from "@/lib/server/api";
import type { AuditEntry, Overview } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overzicht" };

const HEALTH_LABELS: Record<string, string> = { api: "API", database: "Database", worker: "Worker" };
const HEALTH_STATE: Record<string, string> = {
  ok: "In orde",
  unknown: "Onbekend",
  no_heartbeat: "Geen hartslag",
  unreachable: "Niet bereikbaar",
};

export default async function OverviewPage() {
  const [overview, audit] = await Promise.all([
    platformGet<Overview>("/overview"),
    platformGet<AuditEntry[]>("/audit?limit=12"),
  ]);
  const totals = [
    { label: "Tenants", value: overview.tenants, href: "/tenants" },
    { label: "Gebruikers", value: overview.users },
    { label: "Modellen", value: overview.models },
    { label: "Paspoorten", value: overview.passports },
    { label: "Open aanvragen", value: overview.open_requests },
  ];
  const attention = [
    overview.suspended ? { text: `${overview.suspended} opgeschorte tenant${overview.suspended === 1 ? "" : "s"}`, href: "/tenants?status=suspended" } : null,
    overview.registry_failed ? { text: `${overview.registry_failed} mislukte registerregistraties` } : null,
    overview.active_support_sessions ? { text: `${overview.active_support_sessions} actieve support-sessie${overview.active_support_sessions === 1 ? "" : "s"}` } : null,
  ].filter(Boolean) as { text: string; href?: string }[];
  const maxPlan = Math.max(1, ...PLANS.map((p) => overview.plans[p] ?? 0));

  return (
    <>
      <PageHeader title="Overzicht" description="Alle tenants op dit platform, in één blik." />

      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-b border-line pb-8 sm:grid-cols-3 lg:grid-cols-5">
        {totals.map((t) => (
          <div key={t.label} className="grid gap-1">
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="num text-3xl font-medium tracking-tight">
              {t.href ? (
                <Link href={t.href} className="hover:underline hover:underline-offset-4">
                  {formatNumber(t.value)}
                </Link>
              ) : (
                formatNumber(t.value)
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <Section title="Recente platformacties" aside={<Link href="/audit" className="text-sm font-medium underline decoration-line underline-offset-4 hover:decoration-ink">Volledige auditlog</Link>}>
          {audit.length ? (
            <Panel>
              <ul className="divide-y divide-line">
                {audit.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
                    <span className="font-medium">{actionLabel(a.action)}</span>
                    <span className="num text-sm text-muted-foreground">{formatDateTime(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <EmptyState title="Nog geen acties">Zodra beheerders iets doen, verschijnt het hier.</EmptyState>
          )}
        </Section>

        <div className="grid content-start gap-10">
          <Section title="Gezondheid">
            <Panel className="divide-y divide-line">
              {Object.entries(overview.health).map(([key, state]) => (
                <div key={key} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span>{HEALTH_LABELS[key] ?? key}</span>
                  <Pill tone={state === "ok" ? "ok" : state === "unknown" ? "neutral" : "danger"}>{HEALTH_STATE[state] ?? state}</Pill>
                </div>
              ))}
            </Panel>
          </Section>

          {attention.length ? (
            <Section title="Aandacht nodig">
              <ul className="grid gap-2">
                {attention.map((a) => (
                  <li key={a.text} className="rounded-xl bg-signal/15 px-4 py-3 text-sm font-medium text-signal-text">
                    {a.href ? <Link href={a.href} className="underline underline-offset-4">{a.text}</Link> : a.text}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Plannen">
            <ul className="grid gap-3">
              {PLANS.map((plan) => {
                const n = overview.plans[plan] ?? 0;
                return (
                  <li key={plan} className="grid grid-cols-[88px_1fr_40px] items-center gap-3 text-sm">
                    <span>{PLAN_LABELS[plan]}</span>
                    <span className="h-2 rounded-full bg-paper-deep">
                      <span className={cn("block h-full rounded-full bg-ink", n === 0 && "hidden")} style={{ width: `${(n / maxPlan) * 100}%` }} />
                    </span>
                    <span className="num text-right">{n}</span>
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}
