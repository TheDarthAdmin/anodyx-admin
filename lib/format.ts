import type { Plan, TenantStatus } from "@/lib/types";

export const PLAN_LABELS: Record<Plan, string> = {
  trial: "Proef",
  starter: "Starter",
  growth: "Groei",
  volume: "Volume",
  archive: "Archief",
};

export const PLANS: Plan[] = ["trial", "starter", "growth", "volume", "archive"];

export const STATUS_LABELS: Record<TenantStatus, string> = {
  active: "Actief",
  suspended: "Opgeschort",
};

export const ROLE_LABELS: Record<string, string> = {
  owner: "Eigenaar",
  editor: "Bewerker",
  viewer: "Lezer",
};

const dateFmt = new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("nl-BE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const numberFmt = new Intl.NumberFormat("nl-BE");

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFmt.format(new Date(iso)) : "–";
}

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dateTimeFmt.format(new Date(iso)) : "–";
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

/** Usage against a plan limit: "12 / 2.000", or "12" when unlimited. */
export function usageLabel(used: number, limit: number | null): string {
  return limit === null ? formatNumber(used) : `${formatNumber(used)} / ${formatNumber(limit)}`;
}

/** 0..1 share of a limit, clamped; null when unlimited. */
export function usageShare(used: number, limit: number | null): number | null {
  if (limit === null || limit <= 0) return null;
  return Math.min(1, used / limit);
}

/** Readable name for an audit action like `tenant.user_2fa_reset`. */
export function actionLabel(action: string): string {
  const known: Record<string, string> = {
    "tenant.created": "Tenant aangemaakt",
    "tenant.updated": "Tenant gewijzigd",
    "tenant.user_added": "Gebruiker toegevoegd",
    "tenant.user_link_issued": "Eenmalige link uitgegeven",
    "tenant.user_2fa_reset": "2FA gereset",
    "support.started": "Support-sessie gestart",
    "support.read": "Support bekeek gegevens",
    "support.ended": "Support-sessie beëindigd",
    "admin.login": "Beheerder ingelogd",
    "admin.invited": "Beheerder uitgenodigd",
    "admin.password_changed": "Wachtwoord gewijzigd",
    "admin.totp_enabled": "Authenticator-app geactiveerd",
    "admin.passkey_added": "Passkey toegevoegd",
    "admin.passkey_removed": "Passkey verwijderd",
  };
  return known[action] ?? action;
}

/** Support sessions that are neither ended nor expired. */
export function activeSessions<T extends { ended_at: string | null; expires_at: string }>(sessions: T[]): T[] {
  const now = Date.now();
  return sessions.filter((s) => !s.ended_at && new Date(s.expires_at).getTime() > now);
}
