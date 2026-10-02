import { MagnifyingGlass, Plus } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader, Panel, Pill } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatNumber, PLAN_LABELS, STATUS_LABELS } from "@/lib/format";
import { platformGet } from "@/lib/server/api";
import type { TenantRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tenants" };

const FILTERS = [
  { value: "", label: "Alle" },
  { value: "active", label: "Actief" },
  { value: "suspended", label: "Opgeschort" },
];

export default async function TenantsPage({ searchParams }: PageProps<"/tenants">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  const rows = await platformGet<TenantRow[]>(`/tenants${query.size ? `?${query}` : ""}`);

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Elke klant is een tenant: eigen organisatie, gebruikers en data in de gedeelde omgeving."
        actions={
          <Link href="/tenants/nieuw" className={cn(buttonVariants({ size: "lg" }), "no-underline")}>
            <Plus weight="bold" /> Tenant aanmaken
          </Link>
        }
      />

      <form className="mb-5 flex flex-wrap items-end gap-3" role="search">
        <div className="relative w-full max-w-sm">
          <label htmlFor="q" className="sr-only">
            Zoek op naam
          </label>
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Zoek op naam"
            className="h-11 w-full rounded-lg border border-input bg-white pr-3 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div role="group" aria-label="Status" className="flex rounded-lg bg-paper-deep p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              name="status"
              value={f.value}
              className={cn(
                "h-9 rounded-md px-3 text-sm font-medium",
                status === f.value ? "bg-white shadow-[0_1px_2px_rgb(14_20_17/0.12)]" : "text-muted-foreground hover:text-ink",
              )}
              aria-pressed={status === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </form>

      {rows.length ? (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted-foreground">
                {["Tenant", "Status", "Plan", "Eigenaar", "Gebruikers", "Modellen", "Paspoorten", "Aangemaakt"].map((h, i) => (
                  <th key={h} scope="col" className={cn("label-mono px-4 py-3 font-normal", i >= 4 && i <= 6 && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-line/60 last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/tenants/${t.id}`} className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={t.status === "suspended" ? "danger" : "neutral"}>{STATUS_LABELS[t.status]}</Pill>
                  </td>
                  <td className="px-4 py-3">{PLAN_LABELS[t.plan]}</td>
                  <td className="max-w-[220px] truncate px-4 py-3" title={t.owners.join(", ")}>
                    {t.owners[0] ?? "–"}
                    {t.owners.length > 1 ? <span className="text-muted-foreground"> +{t.owners.length - 1}</span> : null}
                  </td>
                  <td className="num px-4 py-3 text-right">{formatNumber(t.users)}</td>
                  <td className="num px-4 py-3 text-right">{formatNumber(t.models)}</td>
                  <td className="num px-4 py-3 text-right">{formatNumber(t.passports)}</td>
                  <td className="num px-4 py-3 text-muted-foreground">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : q || status ? (
        <EmptyState title="Geen tenants gevonden">Pas de zoekterm of het statusfilter aan.</EmptyState>
      ) : (
        <EmptyState title="Nog geen tenants">
          Maak de eerste tenant aan. De eigenaar krijgt een eenmalige link om wachtwoord en tweede factor in te stellen.
        </EmptyState>
      )}
    </>
  );
}
