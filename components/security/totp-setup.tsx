"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useState } from "react";

import { TotpField } from "@/components/auth/totp-field";
import { Button } from "@/components/ui/button";
import { messageFor, postJson } from "@/lib/api";
import { isValidTotpCode } from "@/lib/auth-flow";

/** Authenticator app: show a QR code + secret, confirm with a first code. */
export function TotpSetup({ enabled, onEnabled }: { enabled: boolean; onEnabled?: () => void }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (enabled) {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-medium">
        <CheckCircle weight="fill" className="size-5" /> Authenticator-app is actief.
      </p>
    );
  }

  async function start() {
    setBusy(true);
    setError(null);
    const result = await postJson("/account/totp/setup");
    setBusy(false);
    if (result.status !== 200) return setError(messageFor(result));
    const { secret, otpauth_uri } = result.body as { secret: string; otpauth_uri: string };
    const qr = await QRCode.toDataURL(otpauth_uri, { margin: 1, width: 192, color: { dark: "#0e1411", light: "#ffffff" } });
    setSetup({ secret, qr });
  }

  async function confirm(value: string) {
    if (!isValidTotpCode(value) || busy) return;
    setBusy(true);
    setError(null);
    const result = await postJson("/account/totp/enable", { code: value });
    setBusy(false);
    if (result.status === 200) {
      onEnabled?.();
      router.refresh();
      return;
    }
    setCode("");
    setError(messageFor(result));
  }

  if (!setup) {
    return (
      <div className="grid gap-3">
        <Button variant="outline" className="justify-self-start" onClick={start} disabled={busy}>
          {busy ? "Voorbereiden" : "Authenticator-app koppelen"}
        </Button>
        {error ? <p role="alert" className="text-sm font-medium text-signal-text">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
      <img src={setup.qr} width={192} height={192} alt="QR-code voor je authenticator-app" className="rounded-xl ring-1 ring-line" />
      <div className="grid max-w-sm gap-4">
        <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted-foreground">
          <li>Scan de code met je authenticator-app.</li>
          <li>Lukt scannen niet? Voer de sleutel hieronder handmatig in.</li>
          <li>Vul de code van zes cijfers in die de app toont.</li>
        </ol>
        <code className="num block break-all rounded-lg bg-paper-deep px-3 py-2 text-sm" data-testid="totp-secret">
          {setup.secret}
        </code>
        <TotpField value={code} onChange={setCode} onComplete={confirm} disabled={busy} label="Eerste code" autoFocus />
        {error ? <p role="alert" className="text-sm font-medium text-signal-text">{error}</p> : null}
        <Button className="justify-self-start" onClick={() => confirm(code)} disabled={busy || !isValidTotpCode(code)}>
          {busy ? "Controleren" : "Activeren"}
        </Button>
      </div>
    </div>
  );
}
