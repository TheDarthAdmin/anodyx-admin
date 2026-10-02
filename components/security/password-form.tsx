"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFor, postJson } from "@/lib/api";
import { PASSWORD_MIN } from "@/lib/auth-flow";

/** Set the first password, or change it (then the current one is needed). */
export function PasswordForm({ hasPassword, onSaved }: { hasPassword: boolean; onSaved?: () => void }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<{ busy: boolean; error: string | null; saved: boolean }>({
    busy: false,
    error: null,
    saved: false,
  });
  const short = next.length > 0 && next.length < PASSWORD_MIN;

  return (
    <form
      className="grid max-w-md gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ busy: true, error: null, saved: false });
        const result = await postJson("/account/password", {
          current_password: hasPassword ? current : undefined,
          new_password: next,
        });
        if (result.status === 204) {
          setCurrent("");
          setNext("");
          setState({ busy: false, error: null, saved: true });
          onSaved?.();
          router.refresh();
        } else {
          setState({ busy: false, error: messageFor(result), saved: false });
        }
      }}
    >
      {hasPassword ? (
        <div className="grid gap-2">
          <Label htmlFor="current-password">Huidig wachtwoord</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="new-password">{hasPassword ? "Nieuw wachtwoord" : "Wachtwoord"}</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={next}
          aria-describedby="password-help"
          onChange={(e) => setNext(e.target.value)}
        />
        <p id="password-help" className="text-sm text-muted-foreground">
          {short
            ? `Nog ${PASSWORD_MIN - next.length} tekens.`
            : `Minstens ${PASSWORD_MIN} tekens. Een zin van vier woorden werkt goed.`}
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-signal-text">
          {state.error}
        </p>
      ) : null}
      {state.saved ? (
        <p role="status" className="text-sm font-medium">
          Wachtwoord opgeslagen.
        </p>
      ) : null}
      <Button type="submit" className="justify-self-start" disabled={state.busy || next.length < PASSWORD_MIN}>
        {state.busy ? "Opslaan" : hasPassword ? "Wachtwoord wijzigen" : "Wachtwoord instellen"}
      </Button>
    </form>
  );
}
