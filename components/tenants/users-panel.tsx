"use client";

import { Key, LinkSimple, Plus } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { CopyOnce } from "@/components/copy-once";
import { Pill } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFor, postJson } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/format";
import type { TenantUser } from "@/lib/types";

/** Tenant users with support actions: one-time link, 2FA reset, add user. */
export function UsersPanel({ tenantId, users }: { tenantId: string; users: TenantUser[] }) {
  const router = useRouter();
  const [link, setLink] = useState<{ label: string; value: string; note: string } | null>(null);
  const [resetUser, setResetUser] = useState<TenantUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  async function issueLink(user: TenantUser) {
    setError(null);
    const result = await postJson(`/tenants/${tenantId}/users/${user.id}/login-link`);
    if (result.status !== 200) return setError(messageFor(result));
    setLink({
      label: `Eenmalige link voor ${user.email}`,
      value: (result.body as { link: string }).link,
      note: "Werkt één keer en 72 uur lang. Bezorg hem via een kanaal dat je vertrouwt.",
    });
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
            <div className="grid min-w-0 flex-1 gap-1">
              <p className="truncate font-medium">{u.display_name ? `${u.display_name} (${u.email})` : u.email}</p>
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="ink">{ROLE_LABELS[u.role] ?? u.role}</Pill>
                {!u.has_password ? <Pill>Nog geen wachtwoord</Pill> : null}
                {u.totp_enabled ? <Pill>Authenticator</Pill> : null}
                {u.passkeys ? <Pill>{u.passkeys === 1 ? "1 passkey" : `${u.passkeys} passkeys`}</Pill> : null}
                {!u.totp_enabled && !u.passkeys ? <Pill>Geen tweede factor</Pill> : null}
                {u.locked ? <Pill tone="danger">Vergrendeld</Pill> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="default" onClick={() => issueLink(u)}>
                <LinkSimple /> Eenmalige link
              </Button>
              <Button variant="outline" onClick={() => setResetUser(u)} disabled={!u.totp_enabled && !u.passkeys && !u.locked}>
                <Key /> 2FA resetten
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {link ? <CopyOnce label={link.label} value={link.value} note={link.note} /> : null}
      {error ? <p role="alert" className="text-sm font-medium text-signal-text">{error}</p> : null}

      {adding ? (
        <form
          className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 ring-1 ring-line"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const result = await postJson(`/tenants/${tenantId}/users`, { email, role });
            setBusy(false);
            if (result.status !== 201) return setError(messageFor(result));
            setLink({
              label: `Uitnodiging voor ${email}`,
              value: (result.body as { invite_link: string }).invite_link,
              note: "Ook per e-mail verstuurd. Werkt één keer en 72 uur lang.",
            });
            setEmail("");
            setAdding(false);
            router.refresh();
          }}
        >
          <div className="grid min-w-[240px] flex-1 gap-2">
            <Label htmlFor="new-user">E-mailadres</Label>
            <Input id="new-user" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-role">Rol</Label>
            <select
              id="new-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-11 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="owner">Eigenaar</option>
              <option value="editor">Bewerker</option>
              <option value="viewer">Lezer</option>
            </select>
          </div>
          <Button type="submit" disabled={busy}>Uitnodigen</Button>
          <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
            Annuleren
          </Button>
        </form>
      ) : (
        <Button variant="outline" className="justify-self-start" onClick={() => setAdding(true)}>
          <Plus /> Gebruiker toevoegen
        </Button>
      )}

      <ConfirmDialog
        open={resetUser !== null}
        title="Tweede factoren resetten?"
        confirmLabel="Resetten"
        tone="danger"
        busy={busy}
        onClose={() => setResetUser(null)}
        onConfirm={async () => {
          if (!resetUser) return;
          setBusy(true);
          const result = await postJson(`/tenants/${tenantId}/users/${resetUser.id}/reset-2fa`);
          setBusy(false);
          setResetUser(null);
          if (result.status !== 204) return setError(messageFor(result));
          router.refresh();
        }}
      >
        <p>
          Dit verwijdert de authenticator-app en alle passkeys van <strong>{resetUser?.email}</strong> en heft een
          vergrendeling op. Gebruik het alleen nadat je de identiteit van deze persoon hebt nagegaan.
        </p>
        <p>Na de volgende login stelt de gebruiker opnieuw een tweede factor in. De klant ziet dit in de eigen auditlog.</p>
      </ConfirmDialog>
    </div>
  );
}
