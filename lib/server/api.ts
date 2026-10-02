import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { SECRET_HEADER } from "@/lib/proxy-headers";
import { platformApiUrl, platformSecret } from "@/lib/server/config";

/**
 * Server-side GET against the platform API with the admin's session cookie and the
 * shared secret. Sends the user to login or enrollment when the API says so.
 */
export async function platformGet<T>(path: string): Promise<T> {
  const jar = await cookies();
  const res = await fetch(`${platformApiUrl()}/platform${path}`, {
    headers: { cookie: jar.toString(), [SECRET_HEADER]: platformSecret() },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login");
  if (res.status === 403) {
    const body = (await res.json().catch(() => null)) as { detail?: unknown } | null;
    if (body?.detail === "second_factor_enrollment_required") redirect("/beveiligen");
  }
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`platform API ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** Same, but returns null instead of redirecting on 401 (for the login pages). */
export async function platformGetOptional<T>(path: string): Promise<T | null> {
  const jar = await cookies();
  const res = await fetch(`${platformApiUrl()}/platform${path}`, {
    headers: { cookie: jar.toString(), [SECRET_HEADER]: platformSecret() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Raw status + body, for pages that render 403/410 themselves (support sessions). */
export async function platformGetResult(path: string): Promise<{ status: number; body: unknown }> {
  const jar = await cookies();
  const res = await fetch(`${platformApiUrl()}/platform${path}`, {
    headers: { cookie: jar.toString(), [SECRET_HEADER]: platformSecret() },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/login");
  return { status: res.status, body: await res.json().catch(() => null) };
}
