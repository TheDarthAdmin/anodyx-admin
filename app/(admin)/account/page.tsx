import type { Metadata } from "next";

import { PageHeader, Section } from "@/components/page";
import { PasskeyManager } from "@/components/security/passkey-manager";
import { PasswordForm } from "@/components/security/password-form";
import { TotpSetup } from "@/components/security/totp-setup";
import { platformGet } from "@/lib/server/api";
import type { Account } from "@/lib/types";

export const metadata: Metadata = { title: "Mijn account" };

export default async function AccountPage() {
  const account = await platformGet<Account>("/account");
  return (
    <>
      <PageHeader title="Mijn account" description={account.email} />
      <div className="grid max-w-3xl gap-12">
        <Section title="Wachtwoord">
          <PasswordForm hasPassword={account.has_password} />
        </Section>
        <Section title="Beveiligingssleutels en passkeys">
          <PasskeyManager passkeys={account.passkeys} />
        </Section>
        <Section title="Authenticator-app">
          <TotpSetup enabled={account.totp_enabled} />
        </Section>
      </div>
    </>
  );
}
