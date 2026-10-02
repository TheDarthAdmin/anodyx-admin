"use client";

import Link from "next/link";
import { useState } from "react";

import { CopyOnce } from "@/components/copy-once";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFor, postJson } from "@/lib/api";
import { PLAN_LABELS, PLAN_SUMMARIES, PLANS } from "@/lib/format";
import type { Plan } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateTenantForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Plan>("trial");
  const [trialDays, setTrialDays] = useState(30);
  const [require2fa, setRequire2fa] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; link: string; email: string } | null>(null);

  if (created) {
    return (
      <div className="grid max-w-2xl gap-5">
        <h2 className="text-xl font-bold tracking-tight">{name} is aangemaakt</h2>
        <CopyOnce
          label="Uitnodigingslink voor de eigenaar"
          value={created.link}
          note={`Ook gemaild naar ${created.email}. De link werkt één keer en 72 uur lang.`}
        />
        <Link href={`/tenants/${created.id}`} className={cn(buttonVariants({ size: "lg" }), "justify-self-start no-underline")}>
          Naar de tenant
        </Link>
      </div>
    );
  }

  return (
    <form
      className="grid max-w-xl gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const result = await postJson("/tenants", {
          name,
          owner_email: email,
          plan,
          trial_days: trialDays,
          require_2fa: require2fa,
        });
        setBusy(false);
        if (result.status !== 201) return setError(messageFor(result));
        const body = result.body as { id: string; invite_link: string };
        setCreated({ id: body.id, link: body.invite_link, email });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Naam van de organisatie</Label>
        <Input id="name" required minLength={2} maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="owner">E-mailadres van de eigenaar</Label>
        <Input id="owner" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <p className="text-sm text-muted-foreground">Krijgt een eenmalige link om het account in te stellen.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
        {plan === "trial" ? (
          <div className="grid gap-2">
            <Label htmlFor="trial">Proefperiode in dagen</Label>
            <Input
              id="trial"
              type="number"
              min={1}
              max={365}
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
              className="num"
            />
          </div>
        ) : null}
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={require2fa}
          onChange={(e) => setRequire2fa(e.target.checked)}
          className="size-5 accent-ink"
        />
        Tweestapsverificatie verplicht voor alle gebruikers
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-signal-text">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="justify-self-start" disabled={busy}>
        {busy ? "Aanmaken" : "Tenant aanmaken"}
      </Button>
    </form>
  );
}
