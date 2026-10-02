"use client";

import { Eye } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFor, postJson } from "@/lib/api";

/** Start a read-only support session. The customer's owners get an e-mail. */
export function SupportStart({ tenantId, allowed }: { tenantId: string; allowed: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!allowed) {
    return <p className="text-sm text-muted-foreground">De klant heeft support-toegang uitgezet.</p>;
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const result = await postJson(`/tenants/${tenantId}/support-sessions`, { reason, minutes });
        setBusy(false);
        if (result.status !== 201) return setError(messageFor(result));
        const { id } = result.body as { id: string };
        router.push(`/support/${id}?tenant=${tenantId}`);
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="support-reason">Reden voor meekijken</Label>
        <textarea
          id="support-reason"
          required
          minLength={10}
          maxLength={1000}
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-sm text-muted-foreground">De eigenaars van de klant krijgen deze reden per e-mail.</p>
      </div>
      <div className="grid max-w-[180px] gap-2">
        <Label htmlFor="support-minutes">Duur in minuten</Label>
        <Input
          id="support-minutes"
          type="number"
          min={5}
          max={60}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="num"
        />
      </div>
      {error ? <p role="alert" className="text-sm font-medium text-signal-text">{error}</p> : null}
      <Button type="submit" variant="outline" className="justify-self-start" disabled={busy || reason.trim().length < 10}>
        <Eye /> Meekijken starten
      </Button>
    </form>
  );
}
