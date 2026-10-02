import type { Metadata } from "next";

import { PageHeader } from "@/components/page";
import { CreateTenantForm } from "@/components/tenants/create-tenant-form";

export const metadata: Metadata = { title: "Tenant aanmaken" };

export default function NewTenantPage() {
  return (
    <>
      <PageHeader
        title="Tenant aanmaken"
        back={{ href: "/tenants", label: "Tenants" }}
        description="Een nieuwe klant krijgt een eigen organisatie in de gedeelde omgeving. Geen nieuwe server, geen nieuwe database."
      />
      <CreateTenantForm />
    </>
  );
}
