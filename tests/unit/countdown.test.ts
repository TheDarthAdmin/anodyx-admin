import { describe, expect, it } from "vitest";

import { countdownState, formatCountdown, secondsLeft } from "@/lib/countdown";
import { activeSessions, usageLabel, usageShare } from "@/lib/format";

describe("countdown", () => {
  it("formats minutes and seconds", () => {
    expect(formatCountdown(754)).toBe("12:34");
    expect(formatCountdown(42)).toBe("0:42");
    expect(formatCountdown(-3)).toBe("0:00");
  });

  it("computes seconds left and urgency", () => {
    const now = Date.parse("2026-10-02T10:00:00Z");
    expect(secondsLeft("2026-10-02T10:30:00Z", now)).toBe(1800);
    expect(secondsLeft("2026-10-02T09:00:00Z", now)).toBe(0);
    expect(countdownState(1800)).toBe("running");
    expect(countdownState(300)).toBe("soon");
    expect(countdownState(0)).toBe("over");
  });
});

describe("usage", () => {
  it("shows limits and shares", () => {
    expect(usageLabel(12, null)).toBe("12");
    expect(usageShare(5, null)).toBeNull();
    expect(usageShare(3000, 2000)).toBe(1);
    expect(usageShare(500, 2000)).toBe(0.25);
  });

  it("keeps only running support sessions", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    const rows = [
      { id: "a", ended_at: null, expires_at: future },
      { id: "b", ended_at: past, expires_at: future },
      { id: "c", ended_at: null, expires_at: past },
    ];
    expect(activeSessions(rows).map((r) => r.id)).toEqual(["a"]);
  });
});
