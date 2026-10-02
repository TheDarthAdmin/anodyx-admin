import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader, Panel, Pill, Section } from "@/components/page";
import { SupportStart } from "@/components/tenants/support-start";
import { TenantControls } from "@/components/tenants/tenant-controls";
import { UsersPanel } from "@/components/tenants/users-panel";
import { UsageMeter } from "@/components/usage-meter";
import { activeSessions, formatDate, formatDateTime, formatNumber, PLAN_LABELS, STATUS_LABELS } from "@/lib/format";
import { platformGet } from "@/lib/server/api";
import type { TenantDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Tenant" };

const TENANT_ACTIONS: Record<string, string> = {
  "org.created": "Organisatie aangemaakt",
  "org.updated_by_platform": "Gewijzigd door platformbeheer",
  "user.2fa_reset_by_platform": "2FA gereset door platformbeheer",
  "user.added_by_platform": "Gebruiker toegevoegd door platformbeheer",
  "user.login_link_by_platform": "Eenmalige link door platformbeheer",
  "support.session_started": "Support-sessie gestart",
  "support.read": "Support bekeek gegevens",
  "support.session_ended": "Support-sessie beëindigd",
  "auth.login": "Login",
  "passports.published": "Paspoorten gepubliceerd",
  "model.created": "Model aangemaakt",
  "model.updated": "Model gewijzigd",
  "supplier.created": "Leverancier toegevoegd",
  "units.imported": "Units geïmporteerd",
  "data_request.created": "Gegevensaanvraag verstuurd",
  "data_request.submitted": "Leverancier diende gegevens in",
  "data_request.reviewed": "Gegevens beoordeeld",
};

export default async function TenantPage({ params }: PageProps<"/tenants/[id]">) {
  const { id } = await params;
  const t = await platformGet<TenantDetail>(`/tenants/${id}`);
  const active = activeSessions(t.support_sessions);

  return (
    <>
      <PageHeader
        title={t.name}
        back={{ href: "/tenants", label: "Tenants" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Pill tone={t.status === "suspended" ? "danger" : "neutral"}>{STATUS_LABELS[t.status]}</Pill>
            <Pill tone="ink">{PLAN_LABELS[t.plan]}</Pill>
            <span className="text-sm">
              Sinds {formatDate(t.created_at)}
              {t.plan === "trial" && t.trial_ends_at ? `, proef tot ${formatDate(t.trial_ends_at)}` : ""}
            </span>
          </span>
        }
        actions={
          <Link href={`/audit?tenant=${t.id}`} className="text-sm font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
            Platformacties voor deze tenant
          </Link>
        }
      />

      {t.status === "suspended" ? (
        <p className="mb-8 rounded-xl bg-signal px-5 py-4 font-medium text-ink" role="status">
          Opgeschort: {t.status_reason}
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-10">
          <Section title="Gebruik">
            <Panel className="grid gap-5 p-5 sm:grid-cols-3">
              <UsageMeter label="Modellen" used={t.usage.models} limit={t.limits.models} />
              <UsageMeter label="Paspoorten" used={t.usage.passports} limit={t.limits.passports} />
              <UsageMeter label="Leveranciers" used={t.usage.suppliers} limit={t.limits.suppliers} />
            </Panel>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              {[
                ["Units", t.usage.units],
                ["Open aanvragen", t.usage.open_requests],
                ["Registratiefouten", t.usage.registry_failed],
              ].map(([label, value]) => (
                <div key={label as string} className="grid gap-0.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="num text-lg">{formatNumber(value as number)}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Gebruikers">
            <UsersPanel tenantId={t.id} users={t.users} />
          </Section>

          <Section title="Recente activiteit bij de klant">
            {t.recent_activity.length ? (
              <Panel>
                <ul className="divide-y divide-line">
                  {t.recent_activity.map((a, i) => (
                    <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm">
                      <span>
                        {TENANT_ACTIONS[a.action] ?? a.action}
                        {typeof a.data.platform_admin === "string" ? (
                          <span className="text-muted-foreground"> door {a.data.platform_admin}</span>
                        ) : null}
                      </span>
                      <span className="num text-muted-foreground">{formatDateTime(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : (
              <EmptyState title="Nog geen activiteit" />
            )}
          </Section>
        </div>

        <aside className="grid content-start gap-10">
          <Section title="Instellingen">
            <Panel className="p-5">
              <TenantControls tenant={t} />
            </Panel>
          </Section>

          <Section title="Support">
            <Panel className="grid gap-5 p-5">
              {active.map((s) => (
                <Link
                  key={s.id}
                  href={`/support/${s.id}?tenant=${t.id}`}
                  className="rounded-xl bg-ink px-4 py-3 text-sm font-medium text-paper hover:bg-graphite"
                >
                  Actieve sessie tot {formatDateTime(s.expires_at)}. Verder meekijken
                </Link>
              ))}
              <SupportStart tenantId={t.id} allowed={t.support_access_allowed} />
              {t.support_sessions.length ? (
                <ul className="grid gap-2 border-t border-line pt-4 text-sm">
                  {t.support_sessions.map((s) => (
                    <li key={s.id} className="grid gap-0.5">
                      <span className="num text-muted-foreground">{formatDateTime(s.created_at)}</span>
                      <span>{s.reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          </Section>
        </aside>
      </div>
    </>
  );
}
