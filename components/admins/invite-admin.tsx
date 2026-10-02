"use client";

import { Plus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CopyOnce } from "@/components/copy-once";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFor, postJson } from "@/lib/api";

export function InviteAdmin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ email: string; value: string } | null>(null);

  return (
    <div className="grid gap-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const result = await postJson("/admins", { email, display_name: name || undefined });
          setBusy(false);
          if (result.status !== 201) return setError(messageFor(result));
          setLink({ email, value: (result.body as { invite_link: string }).invite_link });
          setEmail("");
          setName("");
          router.refresh();
        }}
      >
        <div className="grid min-w-[240px] flex-1 gap-2">
          <Label htmlFor="admin-email">E-mailadres</Label>
          <Input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid min-w-[200px] flex-1 gap-2">
          <Label htmlFor="admin-name">Naam (optioneel)</Label>
          <Input id="admin-name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>
          <Plus /> Uitnodigen
        </Button>
      </form>
      {error ? <p role="alert" className="text-sm font-medium text-signal-text">{error}</p> : null}
      {link ? (
        <CopyOnce
          label={`Uitnodiging voor ${link.email}`}
          value={link.value}
          note="Ook per e-mail verstuurd. De link werkt één keer en 72 uur lang; daarna stelt de beheerder wachtwoord en tweede factor in."
        />
      ) : null}
    </div>
  );
}
