import { describe, expect, it } from "vitest";

import { formErrors, formFrom, isDirty, mailStatus, payloadFrom } from "@/lib/mail-settings";
import type { MailSettings } from "@/lib/types";

const SAVED: MailSettings = {
  configured: true,
  enabled: false,
  verified_at: null,
  last_test_error: null,
  host: "smtp.example.com",
  port: 587,
  security: "starttls",
  username: "anodyx@example.com",
  has_password: true,
  from_address: "noreply@example.com",
  from_name: "Anodyx",
  active_source: "file",
};

describe("mailStatus", () => {
  it("says where mail goes when nothing is configured", () => {
    const s = mailStatus({ configured: false, enabled: false, verified_at: null, active_source: "env" });
    expect(s).toMatchObject({ tone: "idle", title: "Nog niet ingesteld" });
    expect(s.detail).toContain("SMTP_*");
  });

  it("asks for a test when saved but not verified", () => {
    expect(mailStatus(SAVED)).toMatchObject({ tone: "idle", title: "Niet actief" });
    expect(mailStatus(SAVED).detail).toContain("testmail");
  });

  it("flags a failed test in Signal", () => {
    expect(mailStatus({ ...SAVED, last_test_error: "ConnectionRefusedError" }).tone).toBe("error");
  });

  it("is active only when the platform setting carries the mail", () => {
    const s = mailStatus({ ...SAVED, enabled: true, verified_at: "2026-10-02T10:00:00Z", active_source: "platform" });
    expect(s).toMatchObject({ tone: "ok", title: "Actief" });
    expect(s.detail).toContain("smtp.example.com:587");
  });
});

describe("payload and dirtiness", () => {
  const form = formFrom(SAVED);

  it("keeps the stored password unless replaced or removed", () => {
    expect(payloadFrom(form, { kind: "keep" })).not.toHaveProperty("password");
    expect(payloadFrom(form, { kind: "replace", value: "" })).not.toHaveProperty("password");
    expect(payloadFrom(form, { kind: "replace", value: "nieuw" }).password).toBe("nieuw");
    expect(payloadFrom(form, { kind: "remove" }).password).toBe("");
  });

  it("normalises empty optional fields to null and the port to a number", () => {
    const body = payloadFrom({ ...form, username: "  ", from_name: "" }, { kind: "keep" });
    expect(body).toMatchObject({ username: null, from_name: null, port: 587 });
  });

  it("knows when there is something to save", () => {
    expect(isDirty(form, SAVED, { kind: "keep" })).toBe(false);
    expect(isDirty(form, SAVED, { kind: "replace", value: "" })).toBe(false);
    expect(isDirty(form, SAVED, { kind: "remove" })).toBe(true);
    expect(isDirty({ ...form, port: "465" }, SAVED, { kind: "keep" })).toBe(true);
  });

  it("validates host, port and sender before saving", () => {
    expect(formErrors({ ...form, host: "", port: "70000", from_address: "geen-adres" })).toEqual({
      host: expect.any(String),
      port: expect.any(String),
      from_address: expect.any(String),
    });
    expect(formErrors(form)).toEqual({});
  });
});
