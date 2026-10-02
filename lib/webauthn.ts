"use client";

import { useSyncExternalStore } from "react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  WebAuthnError,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export type CeremonyResult<T> =
  | { ok: true; credential: T }
  | {
      ok: false;
      reason: "cancelled" | "unsupported" | "duplicate" | "failed";
      message: string;
    };

export function webauthnSupported(): boolean {
  return typeof window !== "undefined" && browserSupportsWebAuthn();
}

const noSubscription = () => () => {};

/** Browser support, false during server rendering and hydration-safe afterwards. */
export function useWebauthnSupport(): boolean {
  return useSyncExternalStore(noSubscription, webauthnSupported, () => false);
}

/** The user agent after hydration ("" on the server). */
export function useUserAgent(): string {
  return useSyncExternalStore(
    noSubscription,
    () => navigator.userAgent,
    () => "",
  );
}

const CANCELLED = "Geannuleerd. Probeer opnieuw wanneer je klaar bent.";

function failure<T>(error: unknown): CeremonyResult<T> {
  const name = error instanceof Error ? error.name : "";
  if (error instanceof WebAuthnError && error.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
    return {
      ok: false,
      reason: "duplicate",
      message: "Deze sleutel is al gekoppeld aan je account.",
    };
  }
  if (name === "NotAllowedError" || name === "AbortError") {
    return { ok: false, reason: "cancelled", message: CANCELLED };
  }
  return {
    ok: false,
    reason: "failed",
    message: "De beveiligingssleutel gaf een fout. Probeer opnieuw.",
  };
}

export async function getCredential(options: unknown): Promise<CeremonyResult<unknown>> {
  if (!webauthnSupported()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "Deze browser ondersteunt geen passkeys.",
    };
  }
  try {
    const credential = await startAuthentication({
      optionsJSON: options as PublicKeyCredentialRequestOptionsJSON,
    });
    return { ok: true, credential };
  } catch (error) {
    return failure(error);
  }
}

export async function createCredential(options: unknown): Promise<CeremonyResult<unknown>> {
  if (!webauthnSupported()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "Deze browser ondersteunt geen passkeys.",
    };
  }
  try {
    const credential = await startRegistration({
      optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
    });
    return { ok: true, credential };
  } catch (error) {
    return failure(error);
  }
}
