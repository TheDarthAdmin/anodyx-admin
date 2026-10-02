import { errorDetail, type ApiResult } from "@/lib/api";

export type FactorMethod = "totp" | "webauthn";

/** What a login step (password, one-time link, second factor) led to. */
export type AuthOutcome =
  | { kind: "success" }
  | { kind: "second_factor"; ticket: string; methods: FactorMethod[] }
  | { kind: "error"; message: string; restart: boolean };

export const AUTH_MESSAGES = {
  invalidCredentials: "E-mailadres of wachtwoord klopt niet.",
  locked: "Te veel mislukte pogingen. Dit account is 15 minuten vergrendeld.",
  rateLimited: "Te veel pogingen vanaf deze verbinding. Wacht een minuut en probeer opnieuw.",
  totpInvalid: "Die code klopt niet. Gebruik de huidige code uit je authenticator-app.",
  ticketExpired: "Dat duurde te lang. Log opnieuw in.",
  webauthnInvalid: "De beveiligingssleutel werd niet herkend. Probeer opnieuw of kies een andere methode.",
  invalidToken: "Deze link is ongeldig, al gebruikt of verlopen. Vraag een nieuwe aan bij een andere beheerder.",
  generic: "Inloggen is niet gelukt. Probeer het opnieuw.",
} as const;

const METHOD_ORDER: FactorMethod[] = ["webauthn", "totp"];

function secondFactor(body: unknown): { ticket: string; methods: FactorMethod[] } | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (!detail || typeof detail !== "object") return null;
  const d = detail as { code?: unknown; ticket?: unknown; methods?: unknown };
  if (d.code !== "second_factor_required" || typeof d.ticket !== "string") return null;
  const methods = Array.isArray(d.methods)
    ? METHOD_ORDER.filter((m) => (d.methods as unknown[]).includes(m))
    : [];
  return { ticket: d.ticket, methods };
}

/** Map any auth endpoint's response to the next step of the login flow. */
export function authOutcome(result: ApiResult): AuthOutcome {
  if (result.status >= 200 && result.status < 300) return { kind: "success" };
  const factor = result.status === 401 ? secondFactor(result.body) : null;
  if (factor) return { kind: "second_factor", ...factor };
  const error = (message: string, restart = false): AuthOutcome => ({ kind: "error", message, restart });
  if (result.status === 429) return error(AUTH_MESSAGES.rateLimited);
  switch (errorDetail(result.body)) {
    case "invalid_credentials":
      return error(AUTH_MESSAGES.invalidCredentials);
    case "account_locked":
      return error(AUTH_MESSAGES.locked, true);
    case "totp_invalid":
      return error(AUTH_MESSAGES.totpInvalid);
    case "ticket_invalid":
      return error(AUTH_MESSAGES.ticketExpired, true);
    case "webauthn_invalid":
    case "webauthn_unknown_credential":
      return error(AUTH_MESSAGES.webauthnInvalid);
    case "invalid_token":
      return error(AUTH_MESSAGES.invalidToken, true);
    default:
      return error(AUTH_MESSAGES.generic);
  }
}

/** Keep only digits, max 6: pasted codes like "123 456" still work. */
export function normalizeTotpInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export function isValidTotpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export const PASSWORD_MIN = 12;

/** Where to go after signing in: the enrollment flow until the account has a second factor. */
export function afterLoginPath(account: { has_password: boolean; enrollment_required: boolean } | null): string {
  if (!account || !account.has_password || account.enrollment_required) return "/beveiligen";
  return "/";
}
