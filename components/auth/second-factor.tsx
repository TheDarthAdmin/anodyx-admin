"use client";

import { Fingerprint, Key } from "@phosphor-icons/react";
import { useState } from "react";

import { TotpField } from "@/components/auth/totp-field";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api";
import { authOutcome, isValidTotpCode, type FactorMethod } from "@/lib/auth-flow";
import { getCredential, useWebauthnSupport } from "@/lib/webauthn";

/** Second step of every login: a passkey or a TOTP code for the ticket from step one. */
export function SecondFactor({
  ticket,
  methods,
  onDone,
  onRestart,
}: {
  ticket: string;
  methods: FactorMethod[];
  onDone: () => void;
  onRestart: (message: string) => void;
}) {
  const supported = useWebauthnSupport();
  const canPasskey = methods.includes("webauthn") && supported;
  const [method, setMethod] = useState<FactorMethod>(canPasskey || !methods.includes("totp") ? "webauthn" : "totp");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(result: Awaited<ReturnType<typeof postJson>>) {
    const outcome = authOutcome(result);
    if (outcome.kind === "success") return onDone();
    if (outcome.kind === "error" && outcome.restart) return onRestart(outcome.message);
    setError(outcome.kind === "error" ? outcome.message : null);
  }

  async function submitCode(value: string) {
    if (!isValidTotpCode(value) || busy) return;
    setBusy(true);
    setError(null);
    await handle(await postJson("/auth/2fa/totp", { ticket, code: value }));
    setCode("");
    setBusy(false);
  }

  async function usePasskey() {
    setBusy(true);
    setError(null);
    const options = await postJson("/auth/2fa/webauthn/options", { ticket });
    if (options.status !== 200) {
      await handle(options);
      setBusy(false);
      return;
    }
    const { options: opts, state } = options.body as { options: unknown; state: string };
    const ceremony = await getCredential(opts);
    if (!ceremony.ok) {
      setError(ceremony.message);
      setBusy(false);
      return;
    }
    await handle(await postJson("/auth/2fa/webauthn", { ticket, state, credential: ceremony.credential }));
    setBusy(false);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Bevestig dat jij het bent</h1>
        <p className="text-sm text-muted-foreground">
          {method === "webauthn"
            ? "Gebruik je beveiligingssleutel of passkey."
            : "Vul de code van zes cijfers uit je authenticator-app in."}
        </p>
      </div>

      {method === "webauthn" ? (
        <Button size="lg" onClick={usePasskey} disabled={busy || !supported}>
          <Fingerprint weight="bold" />
          {busy ? "Wachten op je sleutel" : "Sleutel of passkey gebruiken"}
        </Button>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitCode(code);
          }}
        >
          <TotpField value={code} onChange={setCode} onComplete={submitCode} disabled={busy} autoFocus />
          <Button type="submit" size="lg" disabled={busy || !isValidTotpCode(code)}>
            {busy ? "Controleren" : "Bevestigen"}
          </Button>
        </form>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium text-signal-text">
          {error}
        </p>
      ) : null}

      {methods.length > 1 ? (
        <button
          type="button"
          className="justify-self-start text-sm font-medium underline decoration-line underline-offset-4 hover:decoration-ink"
          onClick={() => {
            setError(null);
            setMethod(method === "webauthn" ? "totp" : "webauthn");
          }}
        >
          {method === "webauthn" ? (
            <span className="inline-flex items-center gap-1.5">
              <Key /> Code uit authenticator-app gebruiken
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Fingerprint /> Beveiligingssleutel gebruiken
            </span>
          )}
        </button>
      ) : null}
    </div>
  );
}
