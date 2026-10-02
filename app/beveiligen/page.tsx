import { Check } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminMark } from "@/components/brand";
import { LogoutButton } from "@/components/shell/logout-button";
import { PasskeyManager } from "@/components/security/passkey-manager";
import { PasswordForm } from "@/components/security/password-form";
import { TotpSetup } from "@/components/security/totp-setup";
import { buttonVariants } from "@/components/ui/button";
import { platformGetOptional } from "@/lib/server/api";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Account beveiligen" };

/** Focused enrollment: nothing else works until the admin has a password and a second factor. */
export default async function EnrollPage() {
  const account = await platformGetOptional<Account>("/account");
  if (!account) redirect("/login");
  const done = account.has_password && !account.enrollment_required;
  const step = !account.has_password ? 1 : 2;

  return (
    <div className="min-h-[100dvh] bg-ink">
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <AdminMark />
        <LogoutButton tone="shell" />
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pb-16">
        <div className="rounded-2xl bg-paper p-6 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">Beveilig je beheerdersaccount</h1>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Je bent ingelogd als <span className="font-medium text-ink">{account.email}</span>. Beheerders werken altijd
            met een wachtwoord én een tweede factor. Tot dat rond is, blijft de rest van de omgeving dicht.
          </p>

          <ol className="mt-8 grid gap-8">
            <li className="grid gap-4">
              <StepHeading number={1} done={account.has_password} active={step === 1}>
                Wachtwoord instellen
              </StepHeading>
              {account.has_password ? null : <PasswordForm hasPassword={false} />}
            </li>
            <li className={cn("grid gap-4", step < 2 && "opacity-50")}>
              <StepHeading number={2} done={!account.enrollment_required} active={step === 2}>
                Tweede factor toevoegen
              </StepHeading>
              {step === 2 && account.enrollment_required ? (
                <div className="grid gap-8">
                  <section className="grid gap-3">
                    <h3 className="font-bold">Beveiligingssleutel of passkey</h3>
                    <PasskeyManager passkeys={account.passkeys} />
                  </section>
                  <section className="grid gap-3">
                    <h3 className="font-bold">Of een authenticator-app</h3>
                    <TotpSetup enabled={account.totp_enabled} />
                  </section>
                </div>
              ) : null}
            </li>
          </ol>

          {done ? (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
              <p className="font-medium">Je account is beveiligd.</p>
              <Link href="/" className={cn(buttonVariants({ size: "lg" }), "no-underline")}>
                Naar het overzicht
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function StepHeading({
  number,
  done,
  active,
  children,
}: {
  number: number;
  done: boolean;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold">
      <span
        className={cn(
          "num grid size-8 place-items-center rounded-full text-sm",
          done ? "bg-volt text-ink" : active ? "bg-ink text-paper" : "bg-paper-deep text-muted-foreground",
        )}
        aria-hidden
      >
        {done ? <Check weight="bold" className="size-4" /> : number}
      </span>
      {children}
      {done ? <span className="sr-only">(klaar)</span> : null}
    </h2>
  );
}
