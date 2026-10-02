"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { nextPathAfterLogin } from "@/components/auth/after-login";
import { SecondFactor } from "@/components/auth/second-factor";
import { postJson } from "@/lib/api";
import { authOutcome, type FactorMethod } from "@/lib/auth-flow";

/** One-time link (bootstrap or invite): consume the token once, then maybe a second factor. */
export function VerifyFlow({ token }: { token: string }) {
  const router = useRouter();
  const sent = useRef(false);
  const [state, setState] = useState<
    | { kind: "checking" }
    | { kind: "factor"; ticket: string; methods: FactorMethod[] }
    | { kind: "error"; message: string }
  >({ kind: "checking" });

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void (async () => {
      const outcome = authOutcome(await postJson("/auth/verify", { token }));
      if (outcome.kind === "success") {
        router.replace(await nextPathAfterLogin());
        router.refresh();
      } else if (outcome.kind === "second_factor")
        setState({ kind: "factor", ticket: outcome.ticket, methods: outcome.methods });
      else setState({ kind: "error", message: outcome.message });
    })();
  }, [router, token]);

  if (state.kind === "factor") {
    return (
      <SecondFactor
        ticket={state.ticket}
        methods={state.methods}
        onDone={async () => {
          router.replace(await nextPathAfterLogin());
          router.refresh();
        }}
        onRestart={(message) => setState({ kind: "error", message })}
      />
    );
  }
  if (state.kind === "error") {
    return (
      <div className="grid gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Link werkt niet</h1>
        <p role="alert" className="text-sm text-muted-foreground">
          {state.message}
        </p>
        <Link href="/login" className="text-sm font-medium underline underline-offset-4">
          Naar inloggen
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-2" aria-live="polite">
      <h1 className="text-2xl font-bold tracking-tight">Link controleren</h1>
      <p className="text-sm text-muted-foreground">Even geduld.</p>
    </div>
  );
}
