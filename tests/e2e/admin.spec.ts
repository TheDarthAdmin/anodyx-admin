import { expect, test } from "@playwright/test";

import { addVirtualAuthenticator, bootstrapLink, logout, startSmtpSink, totp } from "./helpers";

const EMAIL = "admin@anodyx.dev";
const PASSWORD = "lange beheerderszin voor e2e";

test.describe.configure({ mode: "serial" });

let secret = "";

test("bootstrap link → password → authenticator app", async ({ page }) => {
  await page.goto(bootstrapLink());
  await expect(page).toHaveURL(/\/beveiligen/);
  await expect(page.getByRole("heading", { name: "Beveilig je beheerdersaccount" })).toBeVisible();

  await page.getByLabel("Wachtwoord", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Wachtwoord instellen" }).click();
  await expect(page.getByRole("button", { name: "Authenticator-app koppelen" })).toBeVisible();

  // Everything else stays closed until a second factor exists.
  await page.goto("/tenants");
  await expect(page).toHaveURL(/\/beveiligen/);

  await page.getByRole("button", { name: "Authenticator-app koppelen" }).click();
  secret = (await page.getByTestId("totp-secret").textContent())!.trim();
  await page.getByLabel("Eerste code").fill(totp(secret));
  await expect(page.getByText("Je account is beveiligd.")).toBeVisible();
  await page.getByRole("link", { name: "Naar het overzicht" }).click();
  await expect(page.getByRole("heading", { name: "Overzicht" })).toBeVisible();
});

test("login with password + TOTP, manage a tenant, add a passkey", async ({ page }) => {
  await addVirtualAuthenticator(page);
  await page.goto("/login");
  await page.getByLabel("E-mailadres").fill(EMAIL);
  await page.getByLabel("Wachtwoord", { exact: true }).fill("verkeerd wachtwoord");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page.getByText("E-mailadres of wachtwoord klopt niet.")).toBeVisible();

  await page.getByLabel("Wachtwoord", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Inloggen" }).click();
  // The code from the bootstrap step is spent; the next time step is accepted once.
  await page.getByLabel("Code uit je authenticator-app").fill(totp(secret, 1));
  await expect(page.getByRole("heading", { name: "Overzicht" })).toBeVisible();

  // Create a tenant.
  await page.getByRole("navigation", { name: "Hoofdnavigatie" }).getByRole("link", { name: "Tenants" }).click();
  await page.getByRole("link", { name: "Tenant aanmaken" }).click();
  await page.getByLabel("Naam van de organisatie").fill("Fietsen Peeters BV");
  await page.getByLabel("E-mailadres van de eigenaar").fill("eigenaar@peeters.example.com");
  await page.getByLabel("Plan").selectOption("starter");
  await page.getByRole("button", { name: "Tenant aanmaken" }).click();
  await expect(page.getByTestId("copy-once-value")).toContainText("/auth/verify?token=");
  await page.getByRole("link", { name: "Naar de tenant" }).click();
  await expect(page.getByRole("heading", { name: "Fietsen Peeters BV" })).toBeVisible();

  // Suspend (reason required) and reactivate.
  await page.getByRole("button", { name: "Tenant opschorten" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Opschorten" })).toBeDisabled();
  await dialog.getByLabel("Reden").fill("Factuur van september staat open");
  await dialog.getByRole("button", { name: "Opschorten" }).click();
  await expect(page.getByText("Opgeschort: Factuur van september staat open")).toBeVisible();
  await page.getByRole("button", { name: "Heractiveren" }).click();
  await expect(page.getByText("Tenant is weer actief.")).toBeVisible();

  // One-time login link for the owner.
  await page.getByRole("button", { name: "Eenmalige link" }).click();
  await expect(page.getByTestId("copy-once-value")).toContainText("/auth/verify?token=");

  // Read-only support session on the seeded demo tenant (it has models).
  await page.getByRole("navigation", { name: "Hoofdnavigatie" }).getByRole("link", { name: "Tenants" }).click();
  await page.getByRole("link", { name: "Velora Mobility BV" }).click();
  await page.getByLabel("Reden voor meekijken").fill("Klant meldt dat de import van units faalt");
  await page.getByRole("button", { name: "Meekijken starten" }).click();
  await expect(page.getByText("Alleen lezen.")).toBeVisible();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("link", { name: "Velora City 36V 14Ah" }).click();
  await expect(page.getByRole("heading", { name: "Velora City 36V 14Ah" })).toBeVisible();
  await page.getByRole("navigation", { name: "Onderdelen" }).getByRole("link", { name: "Auditlog" }).click();
  await expect(page.getByRole("cell", { name: "support.read" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Sessie beëindigen" }).click();
  await expect(page.getByRole("heading", { name: "Velora Mobility BV" })).toBeVisible();

  // Outgoing mail: a failing server stays inactive, a working one activates after the test.
  await page.getByRole("navigation", { name: "Hoofdnavigatie" }).getByRole("link", { name: "E-mail" }).click();
  await expect(page.getByTestId("mail-status")).toContainText("Nog niet ingesteld");
  const sink = await startSmtpSink();
  try {
    await page.getByLabel("Server", { exact: true }).fill("127.0.0.1");
    await page.getByText("Geen (alleen intern netwerk)").click();
    await page.getByLabel("Poort", { exact: true }).fill("1"); // nothing listens here
    await page.getByLabel("Afzenderadres").fill("noreply@anodyx.example.com");
    await page.getByRole("button", { name: "Opslaan" }).click();
    await expect(page.getByTestId("mail-status")).toContainText("Niet actief");
    await page.getByRole("button", { name: "Testmail versturen" }).click();
    await expect(page.getByText("Testmail niet verstuurd. De instelling blijft uit.")).toBeVisible();
    await expect(page.getByTestId("mail-status")).toContainText("laatste testmail mislukt");

    await page.getByLabel("Poort", { exact: true }).fill(String(sink.port));
    await page.getByRole("button", { name: "Opslaan" }).click();
    await expect(page.getByText("Opgeslagen. Verstuur nu een testmail")).toBeVisible();
    await page.getByRole("button", { name: "Testmail versturen" }).click();
    await expect(page.getByText(`Testmail verstuurd naar ${EMAIL}`)).toBeVisible();
    await expect(page.getByTestId("mail-status")).toContainText("Actief");
    expect(sink.messages.join("\n")).toContain("Subject: Anodyx testmail");

    await page.getByRole("button", { name: "Uitschakelen" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Uitschakelen" }).click();
    await expect(page.getByTestId("mail-status")).toContainText("Niet actief");
  } finally {
    await sink.close();
  }

  // A security key for the next login (virtual FIDO2 authenticator over CDP).
  await page.getByRole("navigation", { name: "Hoofdnavigatie" }).getByRole("link", { name: "Mijn account" }).click();
  await page.getByLabel("Naam van de sleutel").fill("Virtuele sleutel");
  await page.getByRole("button", { name: "Sleutel toevoegen" }).click();
  await expect(page.getByText("Virtuele sleutel")).toBeVisible();
  await logout(page);

  // Next login: password, then the security key (offered first).
  await page.getByLabel("E-mailadres").fill(EMAIL);
  await page.getByLabel("Wachtwoord", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.getByRole("button", { name: "Sleutel of passkey gebruiken" }).click();
  await expect(page.getByRole("heading", { name: "Overzicht" })).toBeVisible();
});
