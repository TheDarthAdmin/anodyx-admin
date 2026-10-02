import type { Metadata } from "next";

import { InviteAdmin } from "@/components/admins/invite-admin";
import { PageHeader, Panel, Pill, Section } from "@/components/page";
import { formatDate } from "@/lib/format";
import { platformGet } from "@/lib/server/api";
import type { Admin } from "@/lib/types";

export const metadata: Metadata = { title: "Beheerders" };

export default async function AdminsPage() {
  const admins = await platformGet<Admin[]>("/admins");
  return (
    <>
      <PageHeader
        title="Beheerders"
        description="Mensen met toegang tot deze beheeromgeving. Elke beheerder werkt met wachtwoord en tweede factor."
      />
      <div className="grid gap-10">
        <Panel>
          <ul className="divide-y divide-line">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="grid gap-0.5">
                  <p className="font-medium">{a.display_name ?? a.email}</p>
                  {a.display_name ? <p className="text-sm text-muted-foreground">{a.email}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="num text-sm text-muted-foreground">sinds {formatDate(a.created_at)}</span>
                  <Pill tone={a.active ? "neutral" : "danger"}>{a.active ? "Actief" : "Uitgeschakeld"}</Pill>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Section title="Beheerder uitnodigen">
          <InviteAdmin />
        </Section>
      </div>
    </>
  );
}
