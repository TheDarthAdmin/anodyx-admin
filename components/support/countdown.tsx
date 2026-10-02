"use client";

import { Clock } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { countdownState, formatCountdown, secondsLeft } from "@/lib/countdown";
import { cn } from "@/lib/utils";

const subscribeSeconds = (tick: () => void) => {
  const timer = window.setInterval(tick, 1000);
  return () => window.clearInterval(timer);
};
const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Time left in the support session; refreshes the page when it runs out. */
export function Countdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const now = useSyncExternalStore(subscribeSeconds, nowSeconds, () => null);
  const left = now === null ? null : secondsLeft(expiresAt, now * 1000);
  const state = left === null ? "running" : countdownState(left);
  useEffect(() => {
    if (state === "over") router.refresh();
  }, [state, router]);

  return (
    <span
      className={cn(
        "num inline-flex h-11 items-center gap-2 rounded-lg px-3 text-lg font-medium",
        state === "soon" || state === "over" ? "bg-signal text-ink" : "bg-graphite text-paper",
      )}
      role="timer"
      aria-label="Resterende tijd"
    >
      <Clock className="size-5" />
      {left === null ? "–:––" : formatCountdown(left)}
    </span>
  );
}
