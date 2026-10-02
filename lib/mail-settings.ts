import type { MailSecurity, MailSettings, MailSource } from "@/lib/types";

export const SECURITY_OPTIONS: { value: MailSecurity; label: string; port: number }[] = [
  { value: "starttls", label: "STARTTLS", port: 587 },
  { value: "ssl", label: "SSL/TLS", port: 465 },
  { value: "none", label: "Geen (alleen intern netwerk)", port: 25 },
];

export function defaultPort(security: MailSecurity): number {
  return SECURITY_OPTIONS.find((o) => o.value === security)?.port ?? 587;
}

/** Common providers, offered as a one-click fill. They set nothing else. */
export const PROVIDER_HINTS: { name: string; host: string; port: number; security: MailSecurity; note: string }[] = [
  { name: "Microsoft 365", host: "smtp.office365.com", port: 587, security: "starttls", note: "SMTP AUTH moet aan staan voor de mailbox." },
  { name: "Google Workspace", host: "smtp.gmail.com", port: 587, security: "starttls", note: "Gebruik een app-wachtwoord." },
  { name: "Brevo", host: "smtp-relay.brevo.com", port: 587, security: "starttls", note: "SMTP-sleutel uit het Brevo-dashboard." },
  { name: "Postmark", host: "smtp.postmarkapp.com", port: 587, security: "starttls", note: "Server-API-token als gebruiker én wachtwoord." },
];

const SOURCE_LABELS: Record<MailSource, string> = {
  platform: "deze SMTP-server",
  env: "de SMTP-instellingen uit de serveromgeving (SMTP_*)",
  console: "de serverlogs: mails worden niet echt verstuurd",
  file: "bestanden op de server (ontwikkelmodus): mails worden niet echt verstuurd",
};

export function sourceLabel(source: MailSource): string {
  return SOURCE_LABELS[source];
}

export type MailStatus = {
  tone: "ok" | "idle" | "error";
  title: string;
  detail: string;
};

/** The status banner: is outgoing mail running through this setting, and if not, why. */
export function mailStatus(s: MailSettings): MailStatus {
  if (s.active_source === "platform" && s.host) {
    return {
      tone: "ok",
      title: "Actief",
      detail: `Alle mails van Anodyx gaan via ${s.host}:${s.port}.`,
    };
  }
  if (!s.configured) {
    return { tone: "idle", title: "Nog niet ingesteld", detail: `Mails gaan nu via ${sourceLabel(s.active_source)}.` };
  }
  if (s.last_test_error) {
    return {
      tone: "error",
      title: "Niet actief: laatste testmail mislukt",
      detail: `Mails gaan nu via ${sourceLabel(s.active_source)}.`,
    };
  }
  return {
    tone: "idle",
    title: "Niet actief",
    detail: `Verstuur een testmail om deze instelling te activeren. Tot dan gaan mails via ${sourceLabel(s.active_source)}.`,
  };
}

export type MailForm = {
  host: string;
  port: string;
  security: MailSecurity;
  username: string;
  from_address: string;
  from_name: string;
};

/** keep: leave the stored password alone; replace: send the new one; remove: clear it. */
export type PasswordMode = { kind: "keep" } | { kind: "replace"; value: string } | { kind: "remove" };

export function formFrom(s: MailSettings): MailForm {
  return {
    host: s.host ?? "",
    port: String(s.port ?? defaultPort(s.security ?? "starttls")),
    security: s.security ?? "starttls",
    username: s.username ?? "",
    from_address: s.from_address ?? "",
    from_name: s.from_name ?? "",
  };
}

export function payloadFrom(form: MailForm, password: PasswordMode): Record<string, unknown> {
  const body: Record<string, unknown> = {
    host: form.host.trim(),
    port: Number(form.port),
    security: form.security,
    username: form.username.trim() || null,
    from_address: form.from_address.trim(),
    from_name: form.from_name.trim() || null,
  };
  // An empty "replace" means the field was opened but left blank: keep the stored one.
  if (password.kind === "replace" && password.value) body.password = password.value;
  if (password.kind === "remove") body.password = "";
  return body;
}

export function isDirty(form: MailForm, saved: MailSettings, password: PasswordMode): boolean {
  if (password.kind === "remove" || (password.kind === "replace" && password.value)) return true;
  const base = formFrom(saved);
  return (Object.keys(form) as (keyof MailForm)[]).some((k) => form[k].trim() !== base[k].trim());
}

/** Client-side checks before saving; the API validates again. */
export function formErrors(form: MailForm): Partial<Record<keyof MailForm, string>> {
  const errors: Partial<Record<keyof MailForm, string>> = {};
  if (!form.host.trim()) errors.host = "Vul de SMTP-server in.";
  const port = Number(form.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.port = "Een poort tussen 1 en 65535.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.from_address.trim())) errors.from_address = "Een geldig afzenderadres.";
  return errors;
}
