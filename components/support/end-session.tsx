"use client";

import { Stop } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api";

export function EndSession({ sessionId, tenantId }: { sessionId: string; tenantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      className="bg-signal text-ink hover:bg-signal/85"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await postJson(`/support-sessions/${sessionId}/end`);
        router.replace(`/tenants/${tenantId}`);
        router.refresh();
      }}
    >
      <Stop weight="fill" /> Sessie beëindigen
    </Button>
  );
}
