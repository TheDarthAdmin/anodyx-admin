import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader, Panel } from "@/components/page";
import { actionLabel, formatDateTime } from "@/lib/format";
import { platformGet } from "@/lib/server/api";
import type { Admin, AuditEntry, TenantRow } from "@/lib/types";

export const metadata: Metadata = { title: "Auditlog" };

/** Data fields worth showing inline; ids stay out of the way. */
function summary(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([k, v]) => v !== null && v !== "" && !k.endsWith("_id") && k !== "support_session" && k !== "amr")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(", ");
}

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const sp = await searchParams;
  const tenant = typeof sp.tenant === "string" ? sp.tenant : "";
  const [entries, admins, tenants] = await Promise.all([
    platformGet<AuditEntry[]>(`/audit?limit=300${tenant ? `&org_id=${encodeURIComponent(tenant)}` : ""}`),
    platformGet<Admin[]>("/admins"),
    platformGet<TenantRow[]>("/tenants"),
  ]);
  const adminName = new Map(admins.map((a) => [a.id, a.display_name ?? a.email]));
  const tenantName = new Map(tenants.map((t) => [t.id, t.name]));

  return (
    <>
      <PageHeader
        title="Auditlog"
        description="Alles wat platformbeheerders doen. Acties op een tenant staan ook in de auditlog van die klant."
      />
      <form className="mb-5 flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <label htmlFor="tenant" className="text-sm font-medium">
            Tenant
          </label>
          <select
            id="tenant"
            name="tenant"
            defaultValue={tenant}
            className="h-11 min-w-[260px] rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Alle tenants en platform</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button className="h-11 rounded-lg bg-paper-deep px-4 text-sm font-medium hover:bg-line">Filteren</button>
      </form>
      {entries.length ? (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted-foreground">
                {["Tijdstip", "Actie", "Beheerder", "Tenant", "Details"].map((h) => (
                  <th key={h} scope="col" className="label-mono px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-line/60 align-top last:border-0">
                  <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(e.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{actionLabel(e.action)}</td>
                  <td className="px-4 py-3">{e.admin_id ? (adminName.get(e.admin_id) ?? "–") : "–"}</td>
                  <td className="px-4 py-3">
                    {e.org_id ? (
                      <Link href={`/tenants/${e.org_id}`} className="underline decoration-line underline-offset-4 hover:decoration-ink">
                        {tenantName.get(e.org_id) ?? "tenant"}
                      </Link>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="max-w-[380px] px-4 py-3 break-words text-muted-foreground">{summary(e.data) || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : (
        <EmptyState title="Geen acties gevonden" />
      )}
    </>
  );
}
