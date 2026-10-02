import type { Metadata } from "next";

import { PageHeader } from "@/components/page";
import { MailSettingsPanel } from "@/components/settings/mail-settings";
import { platformGet } from "@/lib/server/api";
import type { Account, MailSettings } from "@/lib/types";

export const metadata: Metadata = { title: "E-mail" };

export default async function MailSettingsPage() {
  const [settings, account] = await Promise.all([
    platformGet<MailSettings>("/settings/mail"),
    platformGet<Account>("/account"),
  ]);
  return (
    <>
      <PageHeader
        title="E-mail"
        description="De SMTP-server waarmee Anodyx alle mails verstuurt: aanmeldlinks, uitnodigingen, aanvragen aan leveranciers, herinneringen en support-meldingen."
      />
      <MailSettingsPanel initial={settings} adminEmail={account.email} />
    </>
  );
}
