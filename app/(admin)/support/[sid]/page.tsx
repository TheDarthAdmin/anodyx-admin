import { Eye } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, Panel } from "@/components/page";
import { Countdown } from "@/components/support/countdown";
import { EndSession } from "@/components/support/end-session";
import { FieldList } from "@/components/support/value-view";
import { formatDate, formatDateTime } from "@/lib/format";
import { platformGet, platformGetResult } from "@/lib/server/api";
import type { TenantDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Support-sessie" };

const TABS = [
  { key: "models", label: "Modellen" },
  { key: "suppliers", label: "Leveranciers" },
  { key: "data-requests", label: "Aanvragen" },
  { key: "audit-log", label: "Auditlog" },
] as const;

type ModelRow = { id: string; name: string; category: string; model_identifier: string; updated_at: string };
type ModelDetail = ModelRow & { commodity_code: string | null; data: Record<string, unknown>; unit_defaults: Record<string, unknown> };

export default async function SupportPage({ params, searchParams }: PageProps<"/support/[sid]">) {
  const { sid } = await params;
  const sp = await searchParams;
  const tenantId = typeof sp.tenant === "string" ? sp.tenant : "";
  const tab = typeof sp.tab === "string" ? sp.tab : "models";
  const item = typeof sp.item === "string" ? sp.item : "";
  const tenant = tenantId ? await platformGet<TenantDetail>(`/tenants/${tenantId}`) : null;
  const session = tenant?.support_sessions.find((s) => s.id === sid);

  const resource = item ? "model" : tab;
  const result = await platformGetResult(
    `/support-sessions/${sid}/${resource}${item ? `?item=${encodeURIComponent(item)}` : ""}`,
  );
  const base = `/support/${sid}?tenant=${tenantId}`;

  if (result.status === 410 || result.status === 403) {
    return (
      <div className="grid max-w-xl gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {result.status === 410 ? "Sessie afgelopen" : "Support-toegang uitgezet"}
        </h1>
        <p className="text-muted-foreground">
          {result.status === 410
            ? "Deze support-sessie is verlopen of beëindigd. Start een nieuwe als je opnieuw moet meekijken."
            : "De klant heeft support-toegang uitgezet. Je kan niet meer meekijken."}
        </p>
        {tenantId ? (
          <Link href={`/tenants/${tenantId}`} className="justify-self-start font-medium underline underline-offset-4">
            Terug naar {tenant?.name ?? "de tenant"}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="-mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-3 text-paper sm:-mx-8 sm:px-8 lg:sticky lg:top-0 lg:z-[5] lg:-mx-10 lg:-mt-10 lg:mb-8 lg:px-10">
        <p className="flex items-center gap-2 text-sm">
          <Eye className="size-5 text-volt" />
          <span>
            <span className="font-bold">Alleen lezen.</span> Elke weergave wordt gelogd bij {tenant?.name ?? "de klant"}.
          </span>
        </p>
        <div className="flex items-center gap-2">
          {session ? <Countdown expiresAt={session.expires_at} /> : null}
          <EndSession sessionId={sid} tenantId={tenantId} />
        </div>
      </div>

      <header className="mb-6 grid gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Meekijken bij {tenant?.name ?? "tenant"}</h1>
        {session ? <p className="max-w-prose text-muted-foreground">Reden: {session.reason}</p> : null}
      </header>

      <nav aria-label="Onderdelen" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const active = !item && tab === t.key;
          return (
            <Link
              key={t.key}
              href={`${base}&tab=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium",
                active ? "border-ink text-ink" : "border-transparent text-muted-foreground hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {result.status !== 200 ? (
        <EmptyState title="Niet gevonden">Dit onderdeel bestaat niet (meer) bij deze klant.</EmptyState>
      ) : item ? (
        <ModelView model={result.body as ModelDetail} back={`${base}&tab=models`} />
      ) : tab === "models" ? (
        <Rows
          rows={result.body as ModelRow[]}
          empty="Deze klant heeft nog geen modellen."
          columns={["Model", "Identificatie", "Categorie", "Gewijzigd"]}
          render={(m) => [
            <Link key="n" href={`${base}&item=${m.id}`} className="font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
              {m.name}
            </Link>,
            <span key="i" className="num">{m.model_identifier}</span>,
            m.category,
            <span key="d" className="num text-muted-foreground">{formatDate(m.updated_at)}</span>,
          ]}
        />
      ) : tab === "suppliers" ? (
        <Rows
          rows={result.body as { id: string; name: string; kind: string; country: string | null }[]}
          empty="Nog geen leveranciers."
          columns={["Leverancier", "Soort", "Land"]}
          render={(s) => [s.name, s.kind, s.country ?? "–"]}
        />
      ) : tab === "data-requests" ? (
        <Rows
          rows={result.body as { id: string; status: string; deadline: string; fields: number }[]}
          empty="Nog geen aanvragen."
          columns={["Aanvraag", "Status", "Deadline", "Velden"]}
          render={(r) => [<span key="i" className="num">{r.id.slice(0, 8)}</span>, r.status, formatDate(r.deadline), <span key="f" className="num">{r.fields}</span>]}
        />
      ) : (
        <Rows
          rows={result.body as { action: string; entity_type: string; created_at: string }[]}
          empty="Nog geen activiteit."
          columns={["Actie", "Onderwerp", "Tijdstip"]}
          render={(a) => [a.action, a.entity_type, <span key="t" className="num text-muted-foreground">{formatDateTime(a.created_at)}</span>]}
        />
      )}
    </>
  );
}

function Rows<T>({ rows, columns, render, empty }: { rows: T[]; columns: string[]; render: (row: T) => React.ReactNode[]; empty: string }) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <Panel className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted-foreground">
            {columns.map((c) => (
              <th key={c} scope="col" className="label-mono px-4 py-3 font-normal">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {render(row).map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function ModelView({ model, back }: { model: ModelDetail; back: string }) {
  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <Link href={back} className="justify-self-start text-sm font-medium text-muted-foreground hover:text-ink">
          Alle modellen
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">{model.name}</h2>
        <p className="num text-sm text-muted-foreground">
          {model.model_identifier} · {model.category}
          {model.commodity_code ? ` · GN ${model.commodity_code}` : ""}
        </p>
      </div>
      <FieldList data={model.data} />
      {Object.keys(model.unit_defaults ?? {}).length ? (
        <section className="grid gap-4">
          <h2 className="text-xl font-bold tracking-tight">Standaardwaarden per unit</h2>
          <FieldList data={model.unit_defaults} />
        </section>
      ) : null}
    </div>
  );
}
