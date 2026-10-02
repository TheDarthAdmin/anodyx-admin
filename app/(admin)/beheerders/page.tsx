import type { Metadata } from "next";

import { AdminList } from "@/components/admins/admin-list";
import { InviteAdmin } from "@/components/admins/invite-admin";
import { PageHeader, Panel, Section } from "@/components/page";
import { platformGet } from "@/lib/server/api";
import type { Admin } from "@/lib/types";

export const metadata: Metadata = { title: "Beheerders" };

export default async function AdminsPage() {
  const admins = await platformGet<Admin[]>("/admins");
  return (
    <>
      <PageHeader
        title="Beheerders"
        description="Mensen met toegang tot deze beheeromgeving. Elke beheerder werkt met wachtwoord en tweede factor. Kwijt? Een andere beheerder reset die hier."
      />
      <div className="grid gap-10">
        <Panel>
          <AdminList admins={admins} />
        </Panel>
        <Section title="Beheerder uitnodigen">
          <InviteAdmin />
        </Section>
      </div>
    </>
  );
}
