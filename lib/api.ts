/** Browser-side calls, always through the same-origin `/api` proxy. */

export type ApiResult = { status: number; body: unknown };

export async function getJson(path: string): Promise<ApiResult> {
  const res = await fetch(`/api${path}`, { credentials: "same-origin", cache: "no-store" });
  return readResult(res);
}

export async function postJson(path: string, payload?: unknown): Promise<ApiResult> {
  return requestJson("POST", path, payload);
}

export async function requestJson(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  payload?: unknown,
): Promise<ApiResult> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    credentials: "same-origin",
  });
  return readResult(res);
}

async function readResult(res: Response): Promise<ApiResult> {
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body };
}

/** The API error code: `detail` when it is a string, else `detail.code`. */
export function errorDetail(body: unknown): string | undefined {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "code" in detail) {
      const code = (detail as { code: unknown }).code;
      return typeof code === "string" ? code : undefined;
    }
  }
  return undefined;
}

const MESSAGES: Record<string, string> = {
  email_in_use: "Dit e-mailadres heeft al een account.",
  unknown_plan: "Onbekend plan.",
  reason_required: "Geef een reden op voor het opschorten.",
  tenant_not_found: "Deze tenant bestaat niet (meer).",
  user_not_found: "Deze gebruiker bestaat niet (meer).",
  support_access_disabled: "De klant heeft support-toegang uitgezet.",
  support_session_inactive: "Deze support-sessie is verlopen of beëindigd.",
  last_second_factor: "Dit is je enige tweede factor. Voeg eerst een andere toe.",
  totp_invalid: "Die code klopt niet. Gebruik de huidige code uit je authenticator-app.",
  totp_already_enabled: "De authenticator-app is al actief.",
  current_password_wrong: "Je huidige wachtwoord klopt niet.",
  password_too_short: "Kies minstens 12 tekens.",
  password_too_long: "Maximaal 128 tekens.",
  password_like_email: "Je wachtwoord mag niet je e-mailadres zijn.",
  webauthn_invalid: "De beveiligingssleutel werd niet herkend. Probeer opnieuw.",
  not_authenticated: "Je sessie is verlopen. Log opnieuw in.",
};

export function messageFor(result: ApiResult, fallback = "Dat is niet gelukt. Probeer het opnieuw."): string {
  if (result.status === 429) return "Te veel pogingen. Wacht een minuut en probeer opnieuw.";
  const code = errorDetail(result.body);
  return (code && MESSAGES[code]) || fallback;
}
