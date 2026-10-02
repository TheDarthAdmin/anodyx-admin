import { describe, expect, it } from "vitest";

import { afterLoginPath, authOutcome, AUTH_MESSAGES, normalizeTotpInput } from "@/lib/auth-flow";

describe("authOutcome", () => {
  it("success", () => {
    expect(authOutcome({ status: 200, body: {} })).toEqual({ kind: "success" });
  });

  it("second factor, passkey listed first", () => {
    const body = { detail: { code: "second_factor_required", methods: ["totp", "webauthn"], ticket: "t" } };
    expect(authOutcome({ status: 401, body })).toEqual({
      kind: "second_factor",
      ticket: "t",
      methods: ["webauthn", "totp"],
    });
  });

  it.each([
    [401, "invalid_credentials", AUTH_MESSAGES.invalidCredentials, false],
    [423, "account_locked", AUTH_MESSAGES.locked, true],
    [401, "ticket_invalid", AUTH_MESSAGES.ticketExpired, true],
    [400, "invalid_token", AUTH_MESSAGES.invalidToken, true],
    [401, "totp_invalid", AUTH_MESSAGES.totpInvalid, false],
  ])("%i %s", (status, detail, message, restart) => {
    expect(authOutcome({ status, body: { detail } })).toEqual({ kind: "error", message, restart });
  });

  it("rate limit", () => {
    expect(authOutcome({ status: 429, body: null })).toMatchObject({ message: AUTH_MESSAGES.rateLimited });
  });
});

describe("helpers", () => {
  it("normalizes pasted codes", () => {
    expect(normalizeTotpInput("123 456")).toBe("123456");
    expect(normalizeTotpInput("12a3456789")).toBe("123456");
  });

  it("routes to enrollment until password and second factor exist", () => {
    expect(afterLoginPath(null)).toBe("/beveiligen");
    expect(afterLoginPath({ has_password: false, enrollment_required: false })).toBe("/beveiligen");
    expect(afterLoginPath({ has_password: true, enrollment_required: true })).toBe("/beveiligen");
    expect(afterLoginPath({ has_password: true, enrollment_required: false })).toBe("/");
  });
});
