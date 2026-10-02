/**
 * Runtime configuration, read on every request so one image works in every
 * Coolify environment. Server-only: the secret never reaches the browser.
 */
export function platformApiUrl(): string {
  return (process.env.PLATFORM_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
}

export function platformSecret(): string {
  return process.env.PLATFORM_SHARED_SECRET ?? "";
}
