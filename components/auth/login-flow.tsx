"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { nextPathAfterLogin } from "@/components/auth/after-login";
import { SecondFactor } from "@/components/auth/second-factor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJson } from "@/lib/api";
import { authOutcome, type FactorMethod } from "@/lib/auth-flow";

export function LoginFlow({ notice }: { notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice ?? null);
  const [factor, setFactor] = useState<{ ticket: string; methods: FactorMethod[] } | null>(null);

  async function done() {
    router.replace(await nextPathAfterLogin());
    router.refresh();
  }

  if (factor) {
    return (
      <SecondFactor
        ticket={factor.ticket}
        methods={factor.methods}
        onDone={done}
        onRestart={(message) => {
          setFactor(null);
          setPassword("");
          setError(message);
        }}
      />
    );
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const outcome = authOutcome(await postJson("/auth/login", { email, password }));
        setBusy(false);
        if (outcome.kind === "success") return done();
        if (outcome.kind === "second_factor") return setFactor(outcome);
        setError(outcome.message);
      }}
    >
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Inloggen als beheerder</h1>
        <p className="text-sm text-muted-foreground">Daarna vragen we je tweede factor.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username webauthn"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Wachtwoord</Label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground hover:text-ink"
            aria-label={show ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
          >
            {show ? <EyeSlash /> : <Eye />}
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-signal-text">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "Bezig" : "Inloggen"}
      </Button>
    </form>
  );
}
