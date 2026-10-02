"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

/** Native <dialog> for destructive or irreversible actions: real focus trap, Esc closes. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = "default",
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(480px,calc(100vw-2rem))] rounded-2xl bg-paper p-0 text-ink shadow-[0_24px_60px_-20px_rgb(14_20_17/0.5)]"
    >
      <form
        method="dialog"
        className="grid gap-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm();
        }}
      >
        <h2 id="confirm-title" className="text-xl font-bold tracking-tight">
          {title}
        </h2>
        <div className="grid gap-4 text-sm">{children}</div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuleren
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className={tone === "danger" ? "bg-signal text-ink hover:bg-signal/85" : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
