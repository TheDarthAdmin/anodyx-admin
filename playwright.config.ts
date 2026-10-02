import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end against the REAL Anodyx API (platform module), with a fresh embedded
 * Postgres per run. The API repo is expected next to this one, or at ANODYX_API_DIR.
 */
const API_DIR = process.env.ANODYX_API_DIR ?? join(__dirname, "../Anodyx/apps/api");
const API_PORT = 8410;
const WEB_PORT = 3410;
if (!process.env.E2E_DIR) process.env.E2E_DIR = mkdtempSync(join(tmpdir(), "anodyx-admin-e2e-"));
const DIR = process.env.E2E_DIR;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Prints "platform admin login (once): <link>" into api.log; the test reads it.
      command: `bash -c 'cd ${API_DIR} && uv run python scripts/dev_local.py 2>&1 | tee ${DIR}/api.log'`,
      env: {
        DEV_FRESH: "1",
        DEV_DB_DIR: join(DIR, "db"),
        DEV_PORT: String(API_PORT),
        DEV_RELOAD: "0",
        PLATFORM_ADMIN_URL: `http://localhost:${WEB_PORT}`,
        PUBLIC_APP_URL: "http://localhost:3411",
        MAIL_FILE_DIR: join(DIR, "mail"),
        UPLOAD_DIR: join(DIR, "uploads"),
        PLATFORM_SHARED_SECRET: "e2e-platform-secret",
      },
      url: `http://localhost:${API_PORT}/healthz`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: `npx next dev -p ${WEB_PORT}`,
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        PLATFORM_API_URL: `http://localhost:${API_PORT}`,
        PLATFORM_SHARED_SECRET: "e2e-platform-secret",
      },
      url: `http://localhost:${WEB_PORT}/login`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
