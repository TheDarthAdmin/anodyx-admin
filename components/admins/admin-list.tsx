"use client";

import { Key } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pill } from "@/components/page";
import { Button } from "@/components/ui/button";
import { messageFor, postJson } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Admin } from "@/lib/types";

/** Platform admins with their second factors; another admin's 2FA can be reset. */
export function AdminList({ admins }: { admins: Admin[] }) {
  const router = useRouter();
  const [resetAdmin, setResetAdmin] = useState<Admin | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      <ul className="divide-y divide-line">
        {admins.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4"
          >
            <div className="grid min-w-0 flex-1 gap-1">
              <p className="truncate font-medium">
                {a.display_name ?? a.email}
                {a.is_you ? (
                  <span className="text-muted-foreground"> (jij)</span>
                ) : null}
              </p>
              {a.display_name ? (
                <p className="truncate text-sm text-muted-foreground">
                  {a.email}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                <Pill tone={a.active ? "neutral" : "danger"}>
                  {a.active ? "Actief" : "Uitgeschakeld"}
                </Pill>
                {a.totp_enabled ? <Pill>Authenticator</Pill> : null}
                {a.passkeys ? (
                  <Pill>
                    {a.passkeys === 1 ? "1 passkey" : `${a.passkeys} passkeys`}
                  </Pill>
                ) : null}
                {!a.totp_enabled && !a.passkeys ? (
                  <Pill>Geen tweede factor</Pill>
                ) : null}
                {a.locked ? <Pill tone="danger">Vergrendeld</Pill> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="num text-sm text-muted-foreground">
                sinds {formatDate(a.created_at)}
              </span>
              {a.is_you ? null : (
                <Button
                  variant="outline"
                  onClick={() => setResetAdmin(a)}
                  disabled={!a.totp_enabled && !a.passkeys && !a.locked}
                >
                  <Key /> 2FA resetten
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {error ? (
        <p
          role="alert"
          className="px-5 pb-4 text-sm font-medium text-signal-text"
        >
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={resetAdmin !== null}
        title="Tweede factoren resetten?"
        confirmLabel="Resetten"
        tone="danger"
        busy={busy}
        onClose={() => setResetAdmin(null)}
        onConfirm={async () => {
          if (!resetAdmin) return;
          setBusy(true);
          setError(null);
          const result = await postJson(`/admins/${resetAdmin.id}/reset-2fa`);
          setBusy(false);
          setResetAdmin(null);
          if (result.status !== 204) return setError(messageFor(result));
          router.refresh();
        }}
      >
        <p>
          Dit verwijdert de authenticator-app en alle passkeys van{" "}
          <strong>{resetAdmin?.email}</strong> en heft een vergrendeling op.
          Gebruik het alleen nadat je de identiteit van deze persoon hebt
          nagegaan.
        </p>
        <p>
          Bij de volgende login stelt deze beheerder opnieuw een tweede factor
          in. Dit komt in de auditlog.
        </p>
      </ConfirmDialog>
    </div>
  );
}
