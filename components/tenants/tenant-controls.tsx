"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { messageFor, requestJson } from "@/lib/api";
import { PLAN_LABELS, PLAN_SUMMARIES, PLANS } from "@/lib/format";
import type { Plan, TenantDetail } from "@/lib/types";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/** Plan, 2FA requirement and suspension of one tenant. */
export function TenantControls({ tenant }: { tenant: TenantDetail }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(tenant.plan);
  const [require2fa, setRequire2fa] = useState(tenant.require_2fa);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState("");
  const dirty = plan !== tenant.plan || require2fa !== tenant.require_2fa;

  async function patch(changes: Record<string, unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    const result = await requestJson("PATCH", `/tenants/${tenant.id}`, changes);
    setBusy(false);
    if (result.status !== 200) {
      setMessage({ tone: "error", text: messageFor(result) });
      return false;
    }
    setMessage({ tone: "ok", text: ok });
    router.refresh();
    return true;
  }

  return (
    <div className="grid gap-6">
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await patch({ plan, require_2fa: require2fa }, "Wijzigingen opgeslagen.");
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="plan">Plan</Label>
          <select
            id="plan"
            aria-describedby="plan-summary"
            className={selectClass}
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan)}
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>
                {PLAN_LABELS[p]}
              </option>
            ))}
          </select>
          <p id="plan-summary" className="text-sm text-muted-foreground">
            {PLAN_SUMMARIES[plan]}
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={require2fa} onChange={(e) => setRequire2fa(e.target.checked)} className="size-5 accent-ink" />
          Tweestapsverificatie verplicht
        </label>
        <Button type="submit" variant="outline" className="justify-self-start" disabled={!dirty || busy}>
          Opslaan
        </Button>
      </form>

      <div className="grid gap-3 border-t border-line pt-5">
        {tenant.status === "suspended" ? (
          <>
            <p className="text-sm">
              <span className="font-medium">Opgeschort.</span> {tenant.status_reason}
            </p>
            <Button className="justify-self-start" disabled={busy} onClick={() => patch({ status: "active" }, "Tenant is weer actief.")}>
              Heractiveren
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Opschorten blokkeert logins en wijzigingen. Paspoorten en QR-codes blijven online.
            </p>
            <Button variant="destructive" className="justify-self-start" onClick={() => setSuspendOpen(true)}>
              Tenant opschorten
            </Button>
          </>
        )}
      </div>

      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm font-medium text-signal-text" : "text-sm font-medium"}>
          {message.text}
        </p>
      ) : null}

      <ConfirmDialog
        open={suspendOpen}
        title={`${tenant.name} opschorten?`}
        confirmLabel="Opschorten"
        tone="danger"
        busy={busy || reason.trim().length < 3}
        onClose={() => setSuspendOpen(false)}
        onConfirm={async () => {
          if (await patch({ status: "suspended", status_reason: reason.trim() }, "Tenant opgeschort.")) {
            setSuspendOpen(false);
            setReason("");
          }
        }}
      >
        <p>Gebruikers kunnen niet meer inloggen of iets wijzigen. De reden staat in de auditlog van de klant.</p>
        <div className="grid gap-2">
          <Label htmlFor="suspend-reason">Reden</Label>
          <textarea
            id="suspend-reason"
            required
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
