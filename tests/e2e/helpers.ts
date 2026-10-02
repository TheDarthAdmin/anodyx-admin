import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, type Page } from "@playwright/test";

/** The one-time bootstrap link the API printed at startup. */
export function bootstrapLink(): string {
  const log = readFileSync(join(process.env.E2E_DIR!, "api.log"), "utf8");
  const match = log.match(/platform admin login \(once\): (\S+)/);
  if (!match) throw new Error("bootstrap link not found in api.log");
  return new URL(match[1]).pathname + new URL(match[1]).search;
}

function base32(secret: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** RFC 6238 code for `stepOffset` 30-second steps from now. */
export function totp(secret: string, stepOffset = 0): string {
  const counter = Math.floor(Date.now() / 1000 / 30) + stepOffset;
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", base32(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

export async function addVirtualAuthenticator(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Uitloggen" }).last().click();
  await expect(page).toHaveURL(/\/login/);
}
