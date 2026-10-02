import { describe, expect, it } from "vitest";

import { FEATURE_LABELS, PLAN_LABELS, PLAN_SUMMARIES, PLANS, ROLE_LABELS } from "@/lib/format";

describe("plans after ADR 0017", () => {
  it("lists exactly the API's plan keys, in selling order", () => {
    expect(PLANS).toEqual(["trial", "starter", "professional", "business", "enterprise", "archive"]);
    expect(PLANS).not.toContain("growth");
    expect(PLANS).not.toContain("volume");
  });

  it("has a label and a one-line summary for every plan", () => {
    for (const plan of PLANS) {
      expect(PLAN_LABELS[plan]).toBeTruthy();
      expect(PLAN_SUMMARIES[plan].length).toBeGreaterThan(10);
    }
    expect(PLAN_SUMMARIES.enterprise).toMatch(/niet via Stripe/);
  });

  it("names every gated feature and the compliance role", () => {
    expect(Object.keys(FEATURE_LABELS).sort()).toEqual(["api", "erp", "sso", "supplier_portal", "webhooks"]);
    expect(ROLE_LABELS.compliance).toBe("Compliancebeheerder");
  });
});
