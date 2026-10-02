/** Seconds left until `expiresAt`, never negative. */
export function secondsLeft(expiresAt: string, now: number): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

/** 754 → "12:34"; under a minute "0:42"; zero "0:00". */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Urgency for styling: last 5 minutes is "soon", zero is "over". */
export function countdownState(seconds: number): "running" | "soon" | "over" {
  if (seconds <= 0) return "over";
  return seconds <= 300 ? "soon" : "running";
}
