"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { postJson } from "@/lib/api";
import { cn } from "@/lib/utils";

export function LogoutButton({ tone = "shell", className }: { tone?: "shell" | "page"; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await postJson("/auth/logout");
        router.replace("/login?reden=uitgelogd");
        router.refresh();
      }}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
        tone === "shell" ? "text-shell-text hover:bg-graphite hover:text-paper" : "hover:bg-paper-deep",
        className,
      )}
    >
      <SignOut className="size-4" />
      Uitloggen
    </button>
  );
}
