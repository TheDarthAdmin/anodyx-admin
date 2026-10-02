"use client";

import { Fingerprint, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFor, postJson, requestJson } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Account } from "@/lib/types";
import { createCredential, useWebauthnSupport } from "@/lib/webauthn";

/** Security keys and passkeys of this admin: add with a name, list, remove. */
export function PasskeyManager({ passkeys, onAdded }: { passkeys: Account["passkeys"]; onAdded?: () => void }) {
  const router = useRouter();
  const supported = useWebauthnSupport();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const options = await postJson("/account/passkeys/options");
    if (options.status !== 200) {
      setBusy(false);
      return setError(messageFor(options));
    }
    const { options: opts, state } = options.body as { options: unknown; state: string };
    const ceremony = await createCredential(opts);
    if (!ceremony.ok) {
      setBusy(false);
      return setError(ceremony.message);
    }
    const result = await postJson("/account/passkeys", {
      state,
      credential: ceremony.credential,
      name: name.trim() || "Beveiligingssleutel",
    });
    setBusy(false);
    if (result.status !== 201) return setError(messageFor(result));
    setName("");
    onAdded?.();
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    const result = await requestJson("DELETE", `/account/passkeys/${id}`);
    if (result.status !== 200) return setError(messageFor(result));
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {passkeys.length ? (
        <ul className="divide-y divide-line rounded-xl bg-white ring-1 ring-line">
          {passkeys.map((key) => (
            <li key={key.id} className="flex items-center gap-3 px-4 py-3">
              <Fingerprint className="size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{key.name}</p>
                <p className="text-sm text-muted-foreground">
                  Toegevoegd {formatDateTime(key.created_at)}
                  {key.last_used_at ? `, laatst gebruikt ${formatDateTime(key.last_used_at)}` : ", nog niet gebruikt"}
                </p>
              </div>
              <Button variant="ghost" size="icon-lg" aria-label={`${key.name} verwijderen`} onClick={() => remove(key.id)}>
                <Trash />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-prose text-sm text-muted-foreground">
          Een beveiligingssleutel (YubiKey) of passkey (Windows Hello, Touch ID, je telefoon) is de sterkste tweede
          factor. Hij werkt alleen op dit beheerdomein.
        </p>
      )}
      {supported ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid w-full max-w-xs gap-2">
            <Label htmlFor="passkey-name">Naam van de sleutel</Label>
            <Input
              id="passkey-name"
              placeholder="Bijvoorbeeld YubiKey 5C"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <Button variant="outline" onClick={add} disabled={busy}>
            <Fingerprint />
            {busy ? "Wachten op je sleutel" : "Sleutel toevoegen"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Deze browser ondersteunt geen passkeys.</p>
      )}
      {error ? <p role="alert" className="text-sm font-medium text-signal-text">{error}</p> : null}
    </div>
  );
}
