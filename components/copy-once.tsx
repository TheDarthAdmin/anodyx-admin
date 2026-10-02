"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** A secret-ish link shown once (invite, one-time login), with a copy button. */
export function CopyOnce({ label, value, note }: { label: string; value: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-2 rounded-xl bg-ink p-4 text-paper" role="status">
      <p className="label-mono text-shell-dim">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="num min-w-0 flex-1 text-sm break-all text-volt" data-testid="copy-once-value">
          {value}
        </code>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard?.writeText(value).catch(() => undefined);
            setCopied(true);
          }}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Gekopieerd" : "Kopiëren"}
        </Button>
      </div>
      <p className="text-sm text-shell-text">{note ?? "Deze link wordt maar één keer getoond."}</p>
    </div>
  );
}
